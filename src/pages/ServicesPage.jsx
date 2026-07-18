import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeDollarSign,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Landmark,
  MapPin,
  MessageCircle,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Wallet,
  Target,
  Compass,
  Layers3,
  Lightbulb,
  CalendarDays,
  HeartHandshake,
  CircleAlert,
  ArrowUpRight,
} from "lucide-react";

const services = [
  {
    icon: GraduationCap,
    title: "University Selection",
    slug: "university-selection",
    eyebrow: "Find the right fit",
    body: "We help students compare Italian universities by course, city, tuition, scholarship potential and application readiness.",
    who: "Best for students confused between multiple universities, cities or programs.",
    gets: ["University shortlist", "City comparison", "Course fit check", "Budget matching"],
    cta: "Ask For University Help",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: BadgeDollarSign,
    title: "Scholarship Guidance",
    slug: "scholarship-guidance",
    eyebrow: "DSU + regional routes",
    body: "We explain DSU, regional scholarships and merit opportunities inside the full Italy study plan — no fake guarantees.",
    who: "Best for students who need affordable study routes and document clarity.",
    gets: ["DSU direction", "Regional scholarship mapping", "Affordability plan", "Document checklist"],
    cta: "Ask About Scholarships",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: FileCheck2,
    title: "Admission Guidance",
    slug: "admission-guidance",
    eyebrow: "Apply clearly",
    body: "We help students understand requirements, deadlines, portals and application strategy for Italian universities.",
    who: "Best for students ready to apply but unsure about steps and documents.",
    gets: ["Admission roadmap", "Deadline planning", "Requirement review", "Application strategy"],
    cta: "Plan My Admission",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: BookOpenCheck,
    title: "SOP & Documentation",
    slug: "sop-documentation",
    eyebrow: "Prepare stronger files",
    body: "We guide SOP, CV, academic documents, translations and supporting files so students avoid messy submissions.",
    who: "Best for students who want their documents organized before deadlines.",
    gets: ["SOP direction", "CV guidance", "Document checklist", "File review roadmap"],
    cta: "Get Document Help",
    color: "from-purple-500 to-fuchsia-500",
  },
  {
    icon: ShieldCheck,
    title: "Visa Guidance",
    slug: "visa-guidance",
    eyebrow: "Visa roadmap",
    body: "We help students understand the Italy student visa direction, financial proof, appointment planning and file readiness.",
    who: "Best for students moving from admission planning toward visa preparation.",
    gets: ["Visa checklist", "Financial proof direction", "Timeline planning", "Risk awareness"],
    cta: "Ask About Visa",
    color: "from-sky-500 to-cyan-500",
  },
  {
    icon: MessageCircle,
    title: "Free Consultation",
    slug: "free-consultation",
    eyebrow: "Start here",
    body: "Not sure where to begin? Book a free Italy study consultation and we will help you choose the right next step.",
    who: "Best for students who want a simple first roadmap before making decisions.",
    gets: ["Profile review", "Study direction", "Next steps", "Zaifan guidance path"],
    cta: "Book Free Consultation",
    color: "from-orange-500 to-amber-500",
  },
];

const processSteps = [
  {
    icon: UsersRound,
    title: "Understand Your Profile",
    body: "We look at your education, budget, goals, course interest and current readiness.",
  },
  {
    icon: Route,
    title: "Map The Right Path",
    body: "We connect your profile with universities, scholarships, documents and visa planning.",
  },
  {
    icon: ClipboardCheck,
    title: "Build Your Checklist",
    body: "You get a clearer roadmap instead of random browsing and confusing advice.",
  },
  {
    icon: Plane,
    title: "Move Toward Application",
    body: "When ready, we guide the next practical steps for admission and preparation.",
  },
];


const studentStages = [
  {
    icon: Compass,
    stage: "I'm still exploring",
    title: "Start with direction",
    text: "Understand Italy, cities, universities, courses and realistic budget before choosing a route.",
    service: "Free Consultation",
  },
  {
    icon: Target,
    stage: "I know my field",
    title: "Build the shortlist",
    text: "Compare universities by course fit, city, tuition and scholarship potential.",
    service: "University Selection",
  },
  {
    icon: FileCheck2,
    stage: "I'm ready to apply",
    title: "Prepare the application",
    text: "Turn requirements, documents and deadlines into one clear admission plan.",
    service: "Admission Guidance",
  },
  {
    icon: Plane,
    stage: "I have admission",
    title: "Prepare the move",
    text: "Connect scholarship follow-up, visa readiness and arrival planning.",
    service: "Visa Guidance",
  },
];

const servicePromises = [
  {
    icon: CheckCircle2,
    title: "What we do",
    items: [
      "Explain realistic study routes",
      "Help structure your decision",
      "Map documents and timelines",
      "Connect university, funding and visa planning",
    ],
  },
  {
    icon: CircleAlert,
    title: "What we never promise",
    items: [
      "Guaranteed admission",
      "Guaranteed scholarship",
      "Guaranteed visa approval",
      "Fake shortcuts or invented outcomes",
    ],
  },
];

const trustItems = [
  "No fake admission guarantees",
  "No fake DSU promises",
  "No fake visa claims",
  "Italy-first guidance now",
  "More countries added only when real data is ready",
];

export default function ServicesPage() {
  return (
    <main className="overflow-hidden bg-[#fff7ee] text-[#071b3a]">
      <section className="relative px-4 pb-12 pt-28 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute left-[-160px] top-20 h-[420px] w-[420px] rounded-full bg-orange-200/50 blur-3xl" />
        <div className="pointer-events-none absolute right-[-160px] top-32 h-[380px] w-[380px] rounded-full bg-yellow-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-[1500px]">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:items-stretch">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-100 bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 shadow-sm">
                <Sparkles className="h-4 w-4 fill-orange-500" />
                Zaifan Student Support System
              </div>

              <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.06em] text-[#071b3a] sm:text-6xl lg:text-7xl">
                Don't buy a service.
                <span className="text-orange-600"> Build the right study path.</span>
              </h1>

              <p className="mt-6 max-w-3xl text-base font-bold leading-8 text-slate-700 sm:text-lg">
                From choosing Italy to selecting a university, planning scholarships,
                preparing applications and understanding the visa route — use only the
                support you actually need at your current stage.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/appointment?country=Italy&service=Free Italy Study Plan"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(234,88,12,0.25)] transition hover:-translate-y-1 hover:bg-orange-700"
                >
                  Find My Next Step
                  <ArrowRight className="h-4 w-4" />
                </a>

                <Link
                  to="/universities"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 text-sm font-black text-[#071b3a] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:text-orange-600 hover:ring-orange-300"
                >
                  Explore Universities
                  <Building2 className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {["Italy-first", "50+ universities", "DSU guidance", "Admission roadmap", "Visa planning"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#071b3a] shadow-sm ring-1 ring-orange-100"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.8rem] bg-[#071b3a] p-6 text-white shadow-[0_32px_90px_rgba(7,27,58,0.22)] sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border-[34px] border-white/5" />

              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                  Your Italy Journey
                </p>
                <h2 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.05em]">
                  One connected ecosystem.
                </h2>
                <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-white/70">
                  Every stage should connect to the next. Random advice creates gaps;
                  a structured journey makes decisions easier.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    ["01", "Discover Italy", "Country, cities and student life"],
                    ["02", "Choose University", "Course, city, tuition and fit"],
                    ["03", "Plan Funding", "DSU, regional routes and backup budget"],
                    ["04", "Prepare Application", "Requirements, documents and deadlines"],
                    ["05", "Move Toward Visa", "Financial proof, timeline and readiness"],
                  ].map(([number, title, text], index) => (
                    <div
                      key={title}
                      className={`flex items-center gap-4 rounded-2xl p-4 ring-1 ${
                        index === 0
                          ? "bg-orange-600 ring-orange-500"
                          : "bg-white/8 ring-white/10"
                      }`}
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-black text-orange-200">
                        {number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-black">{title}</p>
                        <p className="mt-1 text-xs font-semibold text-white/65">{text}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-white/35" />
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.6rem] bg-white p-5 text-[#071b3a]">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="mt-1 shrink-0 text-orange-600" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">
                        The Zaifan approach
                      </p>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                        Start where you are. Use the service that solves your current
                        problem instead of paying for support you do not need yet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-10">
            <div className="mb-6">
              <p className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
                Find your stage
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Where are you in your Italy journey?
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {studentStages.map((item, index) => (
                <article
                  key={item.stage}
                  className={`rounded-[2rem] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] ${
                    index === 0
                      ? "bg-orange-600 text-white"
                      : index === 1
                        ? "bg-[#071b3a] text-white"
                        : "bg-white text-[#071b3a] ring-1 ring-orange-100"
                  }`}
                >
                  <div className={`grid h-13 w-13 place-items-center rounded-2xl p-3 ${
                    index < 2 ? "bg-white/10 text-orange-200" : "bg-orange-50 text-orange-600"
                  }`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <p className={`mt-5 text-[10px] font-black uppercase tracking-[0.15em] ${
                    index < 2 ? "text-orange-200" : "text-orange-600"
                  }`}>
                    {item.stage}
                  </p>
                  <h3 className="mt-2 text-xl font-black">{item.title}</h3>
                  <p className={`mt-3 text-sm font-bold leading-6 ${
                    index < 2 ? "text-white/72" : "text-slate-600"
                  }`}>
                    {item.text}
                  </p>
                  <a
                    href={`/appointment?country=Italy&service=${encodeURIComponent(item.service)}`}
                    className={`mt-5 inline-flex items-center gap-2 text-xs font-black ${
                      index < 2 ? "text-white" : "text-orange-600"
                    }`}
                  >
                    {item.service}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
                  Support library
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  Choose support based on the problem you need to solve.
                </h2>
              </div>
              <p className="max-w-xl text-sm font-bold leading-7 text-slate-600">
                Every service connects to the appointment flow so students can move from research to action.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => {
                const Icon = service.icon;

                return (
                  <article
                    key={service.title}
                    className="group overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(255,91,18,0.14)]"
                  >
                    <div className={`h-2 bg-gradient-to-r ${service.color}`} />

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${service.color} text-white shadow-lg`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-orange-600 ring-1 ring-orange-100">
                          {service.eyebrow}
                        </span>
                      </div>

                      <h3 className="mt-5 text-2xl font-black text-[#071b3a]">
                        {service.title}
                      </h3>

                      <p className="mt-3 text-sm font-bold leading-7 text-slate-600">
                        {service.body}
                      </p>

                      <div className="mt-5 rounded-[1.4rem] bg-[#fff8f1] p-4 ring-1 ring-orange-100">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                          Who it is for
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#243b61]">
                          {service.who}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-2">
                        {service.gets.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-orange-100"
                          >
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-600" />
                            {item}
                          </div>
                        ))}
                      </div>

                      <a
                        href={`/appointment?country=Italy&service=${encodeURIComponent(service.title)}`}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071b3a] px-5 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-orange-600"
                      >
                        {service.cta}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-10">
            <div className="grid gap-5 lg:grid-cols-2">
              {servicePromises.map((group, index) => (
                <div
                  key={group.title}
                  className={`rounded-[2.4rem] p-7 shadow-[0_22px_65px_rgba(15,23,42,0.08)] ${
                    index === 0
                      ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-100"
                      : "bg-orange-50 text-[#071b3a] ring-1 ring-orange-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`grid h-13 w-13 place-items-center rounded-2xl p-3 ${
                      index === 0 ? "bg-emerald-600 text-white" : "bg-orange-600 text-white"
                    }`}>
                      <group.icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-black">{group.title}</h2>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 rounded-2xl bg-white/75 p-4 text-sm font-bold leading-6 ring-1 ring-black/5"
                      >
                        {index === 0 ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        ) : (
                          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                        )}
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-orange-100 sm:p-7">
              <p className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
                <Route className="h-4 w-4" />
                How it works
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                From confusion to a clear study roadmap.
              </h2>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.title}
                      className="rounded-[1.7rem] bg-[#fff8f1] p-5 ring-1 ring-orange-100 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-600 text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-3xl font-black text-orange-100">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-black">{step.title}</h3>
                      <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                        {step.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2.5rem] bg-[#071b3a] p-6 text-white shadow-[0_24px_70px_rgba(7,27,58,0.20)] sm:p-7">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 ring-1 ring-white/10">
                <ShieldCheck className="h-4 w-4" />
                Honest guidance
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                Clear support without fake promises.
              </h2>

              <div className="mt-6 space-y-3">
                {trustItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold leading-6 text-white/80 ring-1 ring-white/10"
                  >
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-orange-300 text-orange-300" />
                    {item}
                  </div>
                ))}
              </div>

              <a
                href="/appointment?country=Italy&service=Free Italy Study Plan"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-orange-700"
              >
                Start With A Free Consultation
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}