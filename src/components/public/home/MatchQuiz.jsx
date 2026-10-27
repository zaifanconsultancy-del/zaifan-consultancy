import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  Calculator,
  CheckCircle2,
  Cpu,
  Euro,
  FlaskConical,
  Gem,
  Globe2,
  Languages,
  Palette,
  PiggyBank,
  RotateCcw,
  Stethoscope,
  Wallet,
} from "lucide-react";

import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import { COST_LEVEL, COUNTRY_SUBJECTS, COUNTRY_TRAITS } from "../../../data/countries/destinationProfiles";
import { FlagMark } from "../destinations/DestinationUI";

const QUESTIONS = [
  {
    id: "subject",
    title: "What do you want to study?",
    options: [
      { id: "engineering", label: "Engineering", icon: Building2 },
      { id: "computing", label: "Computer Science & IT", icon: Cpu },
      { id: "business", label: "Business & Economics", icon: Briefcase },
      { id: "medicine", label: "Medicine & Health", icon: Stethoscope },
      { id: "design", label: "Design & Architecture", icon: Palette },
      { id: "sciences", label: "Science & Research", icon: FlaskConical },
    ],
  },
  {
    id: "budget",
    title: "What's your budget like?",
    options: [
      { id: "lean", label: "Tight", hint: "Every rupee counts", icon: PiggyBank },
      { id: "moderate", label: "Medium", hint: "Good value matters", icon: Wallet },
      { id: "flexible", label: "Comfortable", hint: "Cost isn't the main thing", icon: Gem },
    ],
  },
  {
    id: "priority",
    title: "What matters most to you?",
    options: [
      { id: "scholarships", label: "Getting a scholarship", icon: Award },
      { id: "postStudy", label: "Working after I graduate", icon: Briefcase },
      { id: "eu", label: "Living in Europe", icon: Euro },
      { id: "english", label: "Studying in English", icon: Languages },
    ],
  },
];

const SUBJECT_WORDS = {
  engineering: "engineering",
  computing: "computer science",
  business: "business",
  medicine: "medicine",
  design: "design",
  sciences: "science",
};

const PRIORITY_REASONS = {
  scholarships: "Big scholarships are available",
  postStudy: "You can stay and work after graduating",
  eu: "You live in Europe with Schengen travel",
  english: "Plenty of programmes taught in English",
};

// Simple, explainable points: subject fit, budget fit and the student's top priority.
function rank(answers) {
  return countryList
    .map((country) => {
      const reasons = [];
      let score = 0;

      const subjectRank = (COUNTRY_SUBJECTS[country.slug] || []).indexOf(answers.subject);
      if (subjectRank === 0) {
        score += 5;
        reasons.push(`One of the best places for ${SUBJECT_WORDS[answers.subject]}`);
      } else if (subjectRank > 0) {
        score += 3;
        reasons.push(`Good for ${SUBJECT_WORDS[answers.subject]}`);
      }

      const cost = COST_LEVEL[country.slug] || 2;
      const traits = COUNTRY_TRAITS[country.slug] || [];
      if (answers.budget === "lean") {
        score += cost === 1 ? 3 : cost === 2 ? 1 : -2;
        if (cost === 1) reasons.push("Lower total cost of studying");
      } else if (answers.budget === "moderate") {
        score += cost <= 2 ? 2 : 0;
      }
      if (answers.budget !== "flexible" && traits.includes("lowTuition")) {
        score += 1;
        if (!reasons.includes("Lower total cost of studying")) reasons.push("Low tuition fees");
      }

      if (traits.includes(answers.priority)) {
        score += 3;
        reasons.push(PRIORITY_REASONS[answers.priority]);
      }

      return { country, score, reasons, subjectRank: subjectRank < 0 ? 99 : subjectRank };
    })
    .sort((a, b) => b.score - a.score || a.subjectRank - b.subjectRank);
}

// `advisorHref` is an in-page anchor on the home page (its form) or a route elsewhere.
function MatchQuiz({ advisorHref = "#apply" }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [locked, setLocked] = useState(false);
  const done = step >= QUESTIONS.length;
  const results = useMemo(() => (done ? rank(answers) : []), [done, answers]);
  const best = results[0];

  const choose = (questionId, optionId) => {
    if (locked) return;
    setLocked(true);
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    // A short beat so the tap registers before the next question slides in.
    window.setTimeout(() => {
      setStep((current) => current + 1);
      setLocked(false);
    }, 220);
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
  };

  const question = QUESTIONS[step];

  return (
    <section id="match" className="scroll-mt-24 bg-[#fff7ed] px-4 py-16 text-[#071f50] sm:px-5 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
            <Calculator size={14} /> 30-second quiz
          </p>
          <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
            Not sure where to go?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-7 text-[#526178] md:text-base">
            Answer three quick questions and we'll show you the country that fits you best.
          </p>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_30px_80px_rgba(9,31,80,0.10)] ring-1 ring-orange-100 md:p-10">
          {/* Progress */}
          <div className="flex items-center gap-2">
            {QUESTIONS.map((item, index) => (
              <span key={item.id} className="h-2 flex-1 overflow-hidden rounded-full bg-[#fff1ea]">
                <motion.span
                  className="block h-full rounded-full bg-[#ff4b12]"
                  animate={{ width: index < step || done ? "100%" : "0%" }}
                  transition={{ duration: 0.35 }}
                />
              </span>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7a879c]">
                    Question {step + 1} of {QUESTIONS.length}
                  </p>
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep((current) => current - 1)}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-[#7a879c] hover:text-[#ff4b12]"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  )}
                </div>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] md:text-4xl">{question.title}</h3>

                <div className={`mt-6 grid gap-3 ${question.options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} ${question.options.length === 6 ? "md:grid-cols-3" : ""}`}>
                  {question.options.map((option) => {
                    const selected = answers[question.id] === option.id;
                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => choose(question.id, option.id)}
                        className={`group flex items-center gap-4 rounded-[22px] p-4 text-left ring-2 transition md:p-5 ${
                          selected
                            ? "bg-[#071f50] text-white ring-[#071f50]"
                            : "bg-[#fff7ed] ring-transparent hover:-translate-y-1 hover:bg-white hover:ring-[#ff4b12]"
                        }`}
                      >
                        <span
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition ${
                            selected ? "bg-[#ff4b12] text-white" : "bg-white text-[#ff4b12] group-hover:bg-[#ff4b12] group-hover:text-white"
                          }`}
                        >
                          <option.icon size={22} strokeWidth={2.4} />
                        </span>
                        <span>
                          <span className="block text-base font-black leading-5">{option.label}</span>
                          {option.hint && (
                            <span className={`mt-1 block text-xs font-bold ${selected ? "text-white/60" : "text-[#7a879c]"}`}>{option.hint}</span>
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8"
              >
                <p className="text-center text-xs font-black uppercase tracking-[0.16em] text-[#7a879c]">Your best match</p>
                <div className="mt-4 flex flex-col items-center text-center">
                  <motion.div initial={{ rotate: -12, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}>
                    <FlagMark country={best.country} className="h-16 w-24" />
                  </motion.div>
                  <h3 className="mt-4 text-5xl font-black tracking-[-0.06em] md:text-6xl">{best.country.name}</h3>
                  <ul className="mt-5 space-y-2 text-left">
                    {(best.reasons.length ? best.reasons : ["A balanced all-round option for you"]).map((reason) => (
                      <li key={reason} className="flex items-center gap-2.5 text-sm font-black md:text-base">
                        <CheckCircle2 size={19} className="shrink-0 text-emerald-500" />
                        {reason}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:flex-row">
                    <Link
                      to={`/countries/${best.country.slug}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-7 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
                    >
                      See the {best.country.name} guide <ArrowRight size={17} strokeWidth={3} />
                    </Link>
                    {advisorHref.startsWith("#") ? (
                      <a
                        href={advisorHref}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-7 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#0b2a6b]"
                      >
                        Talk to an advisor
                      </a>
                    ) : (
                      <Link
                        to={advisorHref}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-7 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#0b2a6b]"
                      >
                        Talk to an advisor
                      </Link>
                    )}
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-orange-100 pt-6">
                    <span className="text-xs font-black text-[#7a879c]">Also good for you:</span>
                    {results.slice(1, 3).map((result) => (
                      <Link
                        key={result.country.slug}
                        to={`/countries/${result.country.slug}`}
                        className="inline-flex items-center gap-2 rounded-full bg-[#fff7ed] px-3 py-2 text-xs font-black ring-1 ring-orange-100 transition hover:text-[#ff4b12]"
                      >
                        <FlagMark country={result.country} className="h-4 w-6 rounded-[3px]" />
                        {result.country.name}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={restart}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black text-[#7a879c] hover:text-[#ff4b12]"
                    >
                      <RotateCcw size={13} /> Start again
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {done && (
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-[#7a879c]">
              <Globe2 size={13} /> A quick starting point. Your grades and documents decide the rest, and we check those for free.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default MatchQuiz;
