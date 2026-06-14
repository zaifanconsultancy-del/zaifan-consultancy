import { motion } from "framer-motion";
import cameraPassport from "../assets/images/services/camera-passport.jpg";

const servicePathways = [
  {
    badge: "Admissions OS",
    title: "University Admissions",
    text: "Build a strong university application with guided profile review, course selection, document checks, and submission support.",
    metric: "Profile → Offer",
    href: "/appointment",
    cta: "Start Admission Plan",
  },
  {
    badge: "Scholarship Desk",
    title: "Scholarship Assistance",
    text: "Discover suitable scholarship routes based on academics, destination, intake, budget, and university requirements.",
    metric: "Funding Guidance",
    href: "#countries",
    cta: "Explore Options",
  },
  {
    badge: "Visa OS",
    title: "Visa Guidance",
    text: "Prepare financial documents, visa files, interview readiness, and application evidence with a clear step-by-step plan.",
    metric: "CAS → Visa",
    href: "/appointment",
    cta: "Plan Visa Case",
  },
  {
    badge: "Document Hub",
    title: "SOP & Documentation",
    text: "Get structured support for SOPs, motivation letters, academic documents, identity files, and university-specific paperwork.",
    metric: "Docs Ready",
    href: "/student-portal",
    cta: "Open Student Portal",
  },
];

const leadActions = [
  {
    title: "Apply Online",
    text: "Create your study abroad profile and begin your application journey.",
    href: "/appointment",
    label: "Apply Now",
  },
  {
    title: "Book Consultation",
    text: "Speak with Zaifan Consultancy before choosing your destination.",
    href: "/appointment",
    label: "Book Free Call",
  },
  {
    title: "Track Progress",
    text: "Existing students can follow applications, documents, tasks, and updates.",
    href: "/student-portal",
    label: "Student Login",
  },
];

const journeySteps = [
  "Profile Review",
  "University Shortlist",
  "Documents",
  "Application",
  "Offer Letter",
  "Visa Preparation",
];

const operatingHighlights = [
  "Admission strategy built around your profile",
  "University and country guidance before applying",
  "Document readiness and SOP direction",
  "Application, offer, CAS, visa and payment visibility",
];

function Services() {
  return (
    <section
      id="services"
      className="relative overflow-hidden bg-[#050505] px-6 py-28 text-white"
    >
      <div className="absolute top-[-15%] right-[-10%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/5 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.025] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-20 lg:grid-cols-[1fr_0.92fr]">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
              Public Lead OS
            </p>

            <h2 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
              Not just consultancy. A complete{" "}
              <span className="text-[#D4AF37]">study abroad command system.</span>
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-gray-400">
              Zaifan Consultancy gives students a guided pathway from the first
              consultation to university admission, document preparation, offer
              updates, visa progress, payments, and student support.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {operatingHighlights.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
                >
                  <div className="flex gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-xs font-bold text-[#D4AF37]">
                      ✓
                    </span>
                    <p className="text-sm leading-relaxed text-gray-300">{item}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/appointment"
                className="rounded-full bg-[#D4AF37] px-7 py-4 text-sm font-extrabold text-black shadow-[0_0_35px_rgba(212,175,55,0.22)] transition hover:bg-[#E7C768]"
              >
                Start Your Application
              </a>

              <a
                href="/student-portal"
                className="rounded-full border border-white/10 bg-white/[0.05] px-7 py-4 text-sm font-extrabold text-white backdrop-blur-xl transition hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
              >
                Existing Student Login
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[3rem] bg-[#D4AF37]/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.035] p-2 shadow-2xl shadow-black/60">
              <div className="relative h-[560px] overflow-hidden rounded-[2rem]">
                <img
                  src={cameraPassport}
                  alt="Zaifan Consultancy services"
                  className="h-full w-full object-cover brightness-[0.72] contrast-110 transition duration-700 hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/50 via-transparent to-transparent" />

                <div className="absolute left-6 top-6 rounded-2xl border border-[#D4AF37]/25 bg-black/45 px-5 py-4 backdrop-blur-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                    Live Journey
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-white">6 Stages</p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
                    Student Operating System
                  </p>

                  <h3 className="mt-4 max-w-md text-3xl font-bold leading-tight">
                    One connected journey from consultation to visa success.
                  </h3>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Visibility
                      </p>
                      <p className="mt-2 font-bold text-white">Tasks & Documents</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Support
                      </p>
                      <p className="mt-2 font-bold text-white">Portal Updates</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative mt-24 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {servicePathways.map((service, index) => (
            <motion.article
              key={service.title}
              initial={{ opacity: 0, y: 55 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.06] hover:shadow-[0_25px_80px_rgba(212,175,55,0.10)]"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#D4AF37]/5 blur-2xl transition group-hover:bg-[#D4AF37]/10" />

              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-2xl font-bold text-[#E7C768]">
                  0{index + 1}
                </div>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                  {service.badge}
                </span>
              </div>

              <h3 className="relative z-10 mt-8 text-2xl font-bold leading-snug">
                {service.title}
              </h3>

              <p className="relative z-10 mt-5 flex-1 leading-relaxed text-gray-400">
                {service.text}
              </p>

              <div className="relative z-10 mt-8 border-t border-white/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                  Pathway
                </p>
                <p className="mt-2 text-sm font-bold text-white">{service.metric}</p>

                <a
                  href={service.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37] transition group-hover:gap-3"
                >
                  {service.cta}
                  <span>→</span>
                </a>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          viewport={{ once: true }}
          className="mt-24 overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:p-8"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
                Guided Journey
              </p>
              <h3 className="mt-4 text-3xl font-extrabold md:text-4xl">
                Your complete path is visible before you begin.
              </h3>
              <p className="mt-4 max-w-2xl leading-relaxed text-gray-400">
                The public website now connects students into a real operating
                journey: apply, consult, shortlist universities, prepare
                documents, submit applications, receive offers, and move toward
                visa approval.
              </p>
            </div>

            <a
              href="/appointment"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#D4AF37] px-8 py-4 text-sm font-extrabold text-black transition hover:bg-[#E7C768]"
            >
              Begin Free Assessment
            </a>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {journeySteps.map((step, index) => (
              <div
                key={step}
                className="relative rounded-2xl border border-white/10 bg-black/25 p-5"
              >
                <p className="text-xs font-bold text-[#D4AF37]">0{index + 1}</p>
                <p className="mt-3 text-sm font-bold leading-snug text-white">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {leadActions.map((action, index) => (
            <motion.a
              key={action.title}
              href={action.href}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="group rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-2xl font-extrabold text-white">{action.title}</p>
                  <p className="mt-3 leading-relaxed text-gray-400">{action.text}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] transition group-hover:translate-x-1">
                  →
                </span>
              </div>
              <p className="mt-6 text-sm font-bold text-[#D4AF37]">{action.label}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;
