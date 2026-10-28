import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, CalendarDays, FileCheck2, GraduationCap, Luggage, MessageCircle, Plane, Send, Stamp } from "lucide-react";

// `months` is the window for each step, counted back from the month classes
// start: [12, 11] means "12 to 11 months before".
const STEPS = [
  {
    icon: MessageCircle,
    title: "Free consultation",
    months: [12, 11],
    you: "Share your grades, budget and dream subject.",
    we: "Tell you honestly which countries and courses fit you.",
    link: { label: "Book it", href: "#apply" },
  },
  {
    icon: GraduationCap,
    title: "Your shortlist",
    months: [11, 10],
    you: "Pick the universities you like best from our list.",
    we: "Match universities, courses and scholarships to your profile.",
    link: { label: "Compare countries", to: "/countries" },
  },
  {
    icon: FileCheck2,
    title: "Documents & tests",
    months: [10, 8],
    you: "Take your IELTS and collect your certificates.",
    we: "Guide your IBCC/HEC attestation, SOP, CV and letters.",
    link: { label: "Get your document list", to: "/countries#documents" },
  },
  {
    icon: Send,
    title: "Applications",
    months: [9, 6],
    you: "Review and approve each application.",
    we: "Submit everything and track every deadline for you.",
    link: { label: "Browse universities", to: "/universities" },
  },
  {
    icon: Stamp,
    title: "Offer & visa",
    months: [5, 2],
    you: "Arrange your funds and attend the embassy appointment.",
    we: "Prepare your visa file and practise the interview with you.",
    link: { label: "Visa help", to: "/services/visa-guidance" },
  },
  {
    icon: Luggage,
    title: "Fly & settle in",
    months: [1, 0],
    you: "Pack your bags and say goodbye at the airport.",
    we: "Help with housing, registration and your first-week checklist.",
  },
];

const INTAKE_MONTHS = [1, 8]; // February and September, as month indexes.
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = { 1: "February", 8: "September" };

// Months are counted as year * 12 + month so windows can be subtracted.
const NOW = new Date().getFullYear() * 12 + new Date().getMonth();

// Applications usually close about six months before classes, so an intake
// closer than this is dropped and the list rolls on to the next ones by itself.
const MIN_MONTHS_AHEAD = 6;

/** The next four February / September intakes students can still apply for. */
const INTAKES = Array.from({ length: 48 }, (_, offset) => NOW + MIN_MONTHS_AHEAD + offset)
  .filter((month) => INTAKE_MONTHS.includes(month % 12))
  .slice(0, 4);
// Default to the first intake that leaves the full year to prepare.
const DEFAULT_INTAKE = INTAKES.find((month) => month - NOW >= 10) ?? INTAKES[0];

function monthLabel(month, withYear = true) {
  return `${MONTH_NAMES[month % 12]}${withYear ? ` ${Math.floor(month / 12)}` : ""}`;
}

function windowLabel(start, end) {
  if (start === end) return monthLabel(start);
  const sameYear = Math.floor(start / 12) === Math.floor(end / 12);
  return `${monthLabel(start, !sameYear)} – ${monthLabel(end)}`;
}

function StepLink({ link, lit }) {
  const className = `mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-black transition-all hover:gap-2.5 ${lit ? "text-[#ff4b12]" : "text-white"}`;
  const body = (
    <>
      {link.label} <ArrowRight size={13} strokeWidth={3} />
    </>
  );
  return link.to ? (
    <Link to={link.to} className={className}>
      {body}
    </Link>
  ) : (
    <a href={link.href} className={className}>
      {body}
    </a>
  );
}

/**
 * The journey as a flight: pick when classes start and each step shows its
 * real months. The plane flies along the route as the section scrolls past,
 * and each step lights up once the plane reaches it.
 */
function HowItWorks() {
  const ref = useRef(null);
  const [intake, setIntake] = useState(DEFAULT_INTAKE);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.6"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const planeLeft = useTransform(progress, [0, 1], ["0%", "100%"]);
  const [reached, setReached] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setReached(Math.min(STEPS.length - 1, Math.floor(value * STEPS.length)));
  });

  const monthsAway = intake - NOW;

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#071f50] px-4 py-16 text-white sm:px-5 md:py-24">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[48px] border-white/[0.04]" />

      <div className="relative mx-auto max-w-[1350px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
            How it works
            <span className="block text-[#ff7b1c]">PAK → your campus.</span>
          </h2>
          <p className="max-w-md text-sm font-semibold leading-7 text-white/70 md:text-base">
            Six steps from your first call to your first lecture: what you do, what we do, and exactly when.
          </p>
        </div>

        {/* When do classes start? */}
        <div className="mt-10 rounded-[26px] bg-white/[0.06] p-5 ring-1 ring-white/10 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-lg font-black">
                <CalendarDays size={20} className="text-[#ff7b1c]" /> When do you want to start classes?
              </p>
              <p className="mt-1 text-sm font-semibold text-white/65">Most courses start in September or February. Pick one and every step shows its month.</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose your intake">
              {INTAKES.map((month) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => setIntake(month)}
                  aria-pressed={intake === month}
                  className={`rounded-full px-4 py-2.5 text-sm font-black transition ${
                    intake === month ? "bg-[#ff4b12] text-white" : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {FULL_MONTHS[month % 12]} {Math.floor(month / 12)}
                </button>
              ))}
            </div>
          </div>
          <p className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-bold ${monthsAway >= 10 ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-300/15 text-amber-100"}`}>
            {monthsAway >= 10
              ? `That's ${monthsAway} months away: plenty of time if you start this month.`
              : `That's only ${monthsAway} months away. It's tight but still possible if you start now; talk to us this week.`}
          </p>
        </div>

        {/* The route */}
        <div className="relative mt-12 px-4" aria-hidden="true">
          <div className="relative h-10">
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.6)_0_8px,transparent_8px_16px)]" />
            <motion.span className="absolute inset-y-0 left-0 my-auto h-1 rounded-full bg-[#ff4b12]" style={{ width: planeLeft }} />
            {STEPS.map((step, index) => (
              <span
                key={step.title}
                className={`absolute top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xs font-black transition-colors duration-300 ${
                  index <= reached ? "bg-[#ff4b12] text-white" : "bg-white text-[#071f50]"
                }`}
                style={{ left: `${(index / (STEPS.length - 1)) * 100}%` }}
              >
                {index + 1}
              </span>
            ))}
            <motion.span className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-[130%] text-[#ff7b1c]" style={{ left: planeLeft }}>
              <Plane size={26} fill="currentColor" className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]" />
            </motion.span>
          </div>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => {
            const lit = index <= reached;
            const start = intake - step.months[0];
            const end = intake - step.months[1];
            const status = end < NOW ? "late" : start <= NOW ? "now" : null;
            return (
              <li
                key={step.title}
                className={`flex flex-col rounded-[26px] p-6 transition duration-500 ${
                  lit ? "bg-white text-[#071f50] shadow-[0_24px_60px_rgba(0,0,0,0.3)]" : "bg-white/[0.06] text-white ring-1 ring-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition duration-500 ${
                      lit ? "bg-[#ff4b12] text-white" : "bg-white/10 text-white"
                    }`}
                  >
                    <step.icon size={22} />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${lit ? "text-[#7a879c]" : "text-white/70"}`}>Step {index + 1}</p>
                    <h3 className="text-xl font-black tracking-[-0.03em]">{step.title}</h3>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
                      lit ? "bg-[#071f50] text-white" : "bg-white/15 text-white"
                    }`}
                  >
                    <CalendarDays size={13} /> {windowLabel(start, end)}
                  </span>
                  {status === "now" && <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-black text-white">Do this now</span>}
                  {status === "late" && <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-black text-[#071f50]">Catch up now</span>}
                </div>
                <p className={`mt-1.5 text-[11px] font-bold ${lit ? "text-[#7a879c]" : "text-white/65"}`}>
                  {step.months[1] === 0 ? "The month before classes start" : `${step.months[1]}–${step.months[0]} months before classes start`}
                </p>

                <dl className="mt-4 grid gap-3 text-sm font-bold leading-6">
                  <div className="flex gap-3">
                    <dt className={`w-9 shrink-0 text-[11px] font-black uppercase leading-6 tracking-[0.12em] ${lit ? "text-[#7a879c]" : "text-white/60"}`}>You</dt>
                    <dd>{step.you}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className={`w-9 shrink-0 text-[11px] font-black uppercase leading-6 tracking-[0.12em] ${lit ? "text-[#ff4b12]" : "text-white/60"}`}>We</dt>
                    <dd>{step.we}</dd>
                  </div>
                </dl>

                {step.link && <StepLink link={step.link} lit={lit} />}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default HowItWorks;
