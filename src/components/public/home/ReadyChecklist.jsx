import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, Check, Clock3, FileBadge2, Landmark, Languages, PenLine, Users } from "lucide-react";

const STORAGE_KEY = "zaifan-ready-checklist";

// Things a student can start on today, whichever country they pick.
const ITEMS = [
  {
    id: "passport",
    icon: BookOpenCheck,
    title: "Passport",
    why: "Every application and visa needs it. Make sure it stays valid well beyond your planned stay.",
    time: "2–6 weeks",
  },
  {
    id: "attestation",
    icon: FileBadge2,
    title: "Attested certificates",
    why: "Matric and FSc attested by IBCC; degree and transcripts by HEC for master's applicants.",
    time: "2–4 weeks",
  },
  {
    id: "english",
    icon: Languages,
    title: "English test",
    why: "IELTS or an equivalent opens most English-taught programmes. A good score can also help with scholarships.",
    time: "1–2 months to prepare",
  },
  {
    id: "cv-sop",
    icon: PenLine,
    title: "CV & motivation letter",
    why: "Universities read these to see who you are. We help you write both.",
    time: "1–2 weeks",
  },
  {
    id: "references",
    icon: Users,
    title: "Recommendation letters",
    why: "Ask two teachers or employers early. Good letters take them time to write.",
    time: "1–3 weeks",
  },
  {
    id: "funds",
    icon: Landmark,
    title: "Proof of funds",
    why: "Visas ask for bank statements. The amount depends on the country, so start planning early.",
    time: "Start early",
  },
];

function readSaved() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function ReadyChecklist() {
  const [done, setDone] = useState(readSaved);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      // Storage blocked: the checklist still works for this visit.
    }
  }, [done]);

  const toggle = (id) => setDone((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const percent = Math.round((done.length / ITEMS.length) * 100);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className="bg-[#fff7ed] px-4 py-16 text-[#071f50] sm:px-5 md:py-24">
      <div className="mx-auto max-w-[1350px]">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          {/* Progress */}
          <div className="lg:sticky lg:top-32">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
              <Clock3 size={14} /> Start today
            </p>
            <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
              Get ready <span className="text-[#ff4b12]">while you decide.</span>
            </h2>
            <p className="mt-4 max-w-md text-sm font-semibold leading-7 text-[#526178] md:text-base">
              Whichever country you choose, you'll need these. Starting now saves months later. Tick off what you already have.
            </p>

            <div className="mt-8 flex items-center gap-6 rounded-[28px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.08)] ring-1 ring-orange-100">
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#fff1ea" strokeWidth="12" />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="#ff4b12"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-3xl font-black tracking-[-0.04em]">{percent}%</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">ready</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-lg font-black leading-6">
                  {done.length === ITEMS.length
                    ? "You're fully prepared!"
                    : done.length === 0
                    ? "Let's get you started."
                    : `${ITEMS.length - done.length} to go.`}
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#61708a]">
                  Your ticks are saved on this device, so you can come back any time.
                </p>
                <a href="#apply" className="mt-3 inline-flex items-center gap-1.5 text-sm font-black text-[#ff4b12] hover:underline">
                  Get help with your documents <ArrowRight size={15} strokeWidth={3} />
                </a>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="grid gap-4 sm:grid-cols-2">
            {ITEMS.map((item, index) => {
              const checked = done.includes(item.id);
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={checked}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: (index % 2) * 0.08 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative flex flex-col rounded-[26px] p-5 text-left ring-2 transition-colors md:p-6 ${
                    checked ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white ring-transparent shadow-[0_16px_45px_rgba(9,31,80,0.07)] hover:ring-[#ff4b12]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl transition ${
                        checked ? "bg-white/10 text-[#ff7b1c]" : "bg-[#fff1ea] text-[#ff4b12]"
                      }`}
                    >
                      <item.icon size={22} strokeWidth={2.4} />
                    </span>
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-full ring-2 transition ${
                        checked ? "bg-[#ff4b12] text-white ring-[#ff4b12]" : "text-transparent ring-orange-200 group-hover:ring-[#ff4b12]"
                      }`}
                    >
                      <Check size={16} strokeWidth={3.5} />
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-black tracking-[-0.03em]">{item.title}</h3>
                  <p className={`mt-2 text-sm font-semibold leading-6 ${checked ? "text-white/70" : "text-[#61708a]"}`}>{item.why}</p>
                  <span
                    className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${
                      checked ? "bg-white/10 text-[#ffb36d]" : "bg-[#fff7ed] text-[#ff4b12]"
                    }`}
                  >
                    <Clock3 size={12} /> {checked ? "Done" : item.time}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReadyChecklist;
