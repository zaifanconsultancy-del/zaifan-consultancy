import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";

const courseMatches = [
  {
    id: 1,
    course: "Computer Science",
    university: "University of Hertfordshire",
    country: "United Kingdom",
    level: "Bachelor's",
    subject: "Computer Science",
    budget: "$10k-$20k",
    tuition: "£14k - £17k",
    scholarship: "Available",
    intake: "Jan / Sep",
  },
  {
    id: 2,
    course: "Business Management",
    university: "University of Greenwich",
    country: "United Kingdom",
    level: "Intermediate",
    subject: "Business",
    budget: "$10k-$20k",
    tuition: "£15k - £18k",
    scholarship: "Available",
    intake: "Jan / Sep",
  },
  {
    id: 3,
    course: "MBA",
    university: "University Canada West",
    country: "Canada",
    level: "Bachelor's",
    subject: "Business",
    budget: "$20k-$30k",
    tuition: "CAD 20k+",
    scholarship: "Available",
    intake: "Jan / Apr / Jul / Oct",
  },
  {
    id: 4,
    course: "Engineering Pathway",
    university: "International Pathway Colleges",
    country: "United Kingdom",
    level: "Intermediate",
    subject: "Engineering",
    budget: "$10k-$20k",
    tuition: "£10k - £15k",
    scholarship: "Available",
    intake: "Jan / May / Sep",
  },
  {
    id: 5,
    course: "Health Sciences",
    university: "Deakin University",
    country: "Australia",
    level: "Bachelor's",
    subject: "Health Sciences",
    budget: "$30k+",
    tuition: "AUD 30k+",
    scholarship: "Available",
    intake: "Feb / Jul",
  },
  {
    id: 6,
    course: "Business & Marketing",
    university: "Berlin School of Business",
    country: "Europe",
    level: "Bachelor's",
    subject: "Business",
    budget: "Under $10k",
    tuition: "Low tuition route",
    scholarship: "Limited",
    intake: "Feb / Sep",
  },
];

const qualifications = [
  "Any Qualification",
  "Matric",
  "Intermediate",
  "A Levels",
  "Bachelor's",
  "Master's",
];

const countries = [
  "Any Country",
  "United Kingdom",
  "Australia",
  "Canada",
  "Europe",
];

const subjects = [
  "Any Subject",
  "Business",
  "Computer Science",
  "Engineering",
  "Health Sciences",
  "Law",
  "Arts",
];

const budgets = [
  "Any Budget",
  "Under $10k",
  "$10k-$20k",
  "$20k-$30k",
  "$30k+",
];

function CourseFinder() {
  const [qualification, setQualification] = useState("Any Qualification");
  const [country, setCountry] = useState("Any Country");
  const [subject, setSubject] = useState("Any Subject");
  const [budget, setBudget] = useState("Any Budget");
  const [searched, setSearched] = useState(false);

  const results = useMemo(() => {
    return courseMatches.filter((item) => {
      const matchesQualification =
        qualification === "Any Qualification" ||
        item.level === qualification ||
        qualification === "A Levels";

      const matchesCountry =
        country === "Any Country" || item.country === country;

      const matchesSubject =
        subject === "Any Subject" || item.subject === subject;

      const matchesBudget = budget === "Any Budget" || item.budget === budget;

      return (
        matchesQualification && matchesCountry && matchesSubject && matchesBudget
      );
    });
  }, [qualification, country, subject, budget]);

  const visibleResults = searched ? results.slice(0, 3) : courseMatches.slice(0, 3);

  return (
    <section className="relative z-20 -mt-20 px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl shadow-slate-950/10">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 text-white sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Find Your Study Path
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                Search courses, countries & scholarships.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
                Choose your qualification, destination, subject and budget. We’ll
                show you realistic study options to start your journey.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <BookOpen className="mb-2 h-5 w-5" />
                  <p className="text-sm font-bold">Course Matching</p>
                  <p className="mt-1 text-xs text-emerald-50">
                    Find programs by subject and level.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <Wallet className="mb-2 h-5 w-5" />
                  <p className="text-sm font-bold">Budget Friendly</p>
                  <p className="mt-1 text-xs text-emerald-50">
                    Compare tuition and funding routes.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 lg:p-8">
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={qualification}
                  onChange={(event) => setQualification(event.target.value)}
                  className="h-13 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
                >
                  {qualifications.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <select
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className="h-13 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
                >
                  {countries.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <select
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="h-13 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
                >
                  {subjects.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <select
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="h-13 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white"
                >
                  {budgets.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSearched(true)}
                className="mt-4 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
              >
                <Search className="h-4 w-4" />
                Search Programs
              </button>

              <div className="mt-5 grid gap-3">
                {visibleResults.length > 0 ? (
                  visibleResults.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="font-black text-slate-950">
                            {item.course}
                          </h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {item.university}
                          </p>
                        </div>

                        <a
                          href="#contact"
                          className="inline-flex items-center gap-2 text-sm font-black text-emerald-700"
                        >
                          Apply
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-slate-600">
                          <MapPin className="h-3 w-3 text-emerald-600" />
                          {item.country}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-slate-600">
                          <Wallet className="h-3 w-3 text-emerald-600" />
                          {item.tuition}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-slate-600">
                          <GraduationCap className="h-3 w-3 text-emerald-600" />
                          {item.intake}
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="font-black text-slate-950">
                      No exact match found.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Contact Zaifan and we’ll manually shortlist options for
                      your profile.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#universities"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  Explore Universities
                </a>

                <a
                  href="#contact"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-500"
                >
                  Free Eligibility Check
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourseFinder;