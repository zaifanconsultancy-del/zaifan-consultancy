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
          <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 shadow-sm">
                <Sparkles className="h-4 w-4 fill-orange-500" />
                Zaifan Services Ecosystem
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-[#071b3a] sm:text-6xl lg:text-7xl">
                How can we help you{" "}
                <span className="text-orange-600">study in Italy?</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-slate-700 sm:text-lg">
                Choose the support you need: university selection, scholarships, admission, documents, visa guidance or a free consultation.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/appointment?country=Italy&service=Free Italy Study Plan"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-7 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(234,88,12,0.25)] transition hover:-translate-y-1 hover:bg-orange-700"
                >
                  Book Free Consultation
                  <ArrowRight className="h-4 w-4" />
                </a>

                <Link
                  to="/universities"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-black text-[#071b3a] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:text-orange-600 hover:ring-orange-300"
                >
                  Explore Universities
                  <Building2 className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-orange-100 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
              <div className="rounded-[2rem] bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-6">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-orange-600 text-white shadow-lg shadow-orange-600/20">
                    <Landmark className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                      Italy-first support
                    </p>
                    <h2 className="mt-1 text-2xl font-black">
                      One ecosystem, not random advice.
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    ["50+", "Universities"],
                    ["DSU", "Scholarship route"],
                    ["Visa", "Roadmap"],
                    ["Free", "Consultation"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-orange-100"
                    >
                      <p className="text-3xl font-black text-orange-600">{value}</p>
                      <p className="mt-1 text-xs font-black text-slate-600">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-[#071b3a] p-5 text-white">
                  <p className="text-sm font-bold leading-7 text-white/80">
                    DSU stays inside the Scholarship Guidance ecosystem. No separate DSU page, no fake promises, no standalone shortcut.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-10">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
                  Choose your support
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  Services built around real student decisions.
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
                    className="group overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_28px_80px_rgba(255,91,18,0.14)]"
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