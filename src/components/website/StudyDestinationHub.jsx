import React from "react";
import {
  ArrowRight,
  Globe2,
  GraduationCap,
  Briefcase,
  Wallet,
} from "lucide-react";

const destinations = [
  {
    country: "United Kingdom",
    tuition: "£10k - £18k",
    intake: "Jan / May / Sep",
    work: "20 hrs/week",
    bestFor: "Fast degrees, strong university options",
  },
  {
    country: "Australia",
    tuition: "AUD 22k - 38k",
    intake: "Feb / Jul",
    work: "Student work options",
    bestFor: "Career routes and lifestyle",
  },
  {
    country: "Canada",
    tuition: "CAD 16k - 30k",
    intake: "Jan / May / Sep",
    work: "Part-time work options",
    bestFor: "Long-term settlement planning",
  },
  {
    country: "Europe",
    tuition: "Low tuition routes",
    intake: "Sep / Feb",
    work: "Varies by country",
    bestFor: "Affordable study abroad options",
  },
];

export default function StudyDestinationHub() {
  return (
    <section className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
              <Globe2 className="h-4 w-4" />
              Study Destination Hub
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Compare where you should study.
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Quick destination comparison for students who want to understand
              cost, intakes, work options, and the best-fit country before
              applying.
            </p>
          </div>

          <a
            href="#contact"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-emerald-600"
          >
            Get Destination Advice
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {destinations.map((item) => (
            <article
              key={item.country}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-xl font-bold text-slate-950">
                {item.country}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.bestFor}
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">
                    {item.tuition}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">
                    {item.intake}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">
                    {item.work}
                  </span>
                </div>
              </div>

              <a
                href="#contact"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"
              >
                Check eligibility
                <ArrowRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}