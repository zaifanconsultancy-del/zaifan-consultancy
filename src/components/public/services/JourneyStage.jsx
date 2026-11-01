import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Plane } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { COUNTERS, HUB_STEPS, JOURNEY_STAGES, counterLabel } from "./serviceMeta";

const GROUPS = [
  { id: "now", title: "Go here now", note: "These fit exactly where you are.", tone: "bg-[#ff4b12] text-white" },
  { id: "next", title: "Coming up next", note: "Worth a look so nothing surprises you.", tone: "bg-[#071f50] text-white" },
  { id: "earlier", title: "Earlier stops", note: "Skipped one? You can still use it.", tone: "bg-white text-[#071f50] ring-1 ring-orange-100" },
];

function groupFor(service, stage) {
  if (service.anyStage) return "now";
  if (service.stage === stage) return "now";
  if (service.stage === stage + 1) return "next";
  if (service.stage < stage) return "earlier";
  return "later";
}

function CounterChip({ service, stage }) {
  return (
    <Link
      to={`/services/${service.slug}`}
      className="group flex items-center gap-3 rounded-2xl bg-white p-3 text-[#071f50] ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:ring-[#ff4b12]/40"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff1ea] text-[#ff4b12]">
        <service.icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">
          {counterLabel(service)}
          {service.anyStage && stage > 0 ? " · any time" : ""}
        </span>
        <span className="block truncate text-sm font-black">{service.title}</span>
      </span>
      <ArrowUpRight size={16} strokeWidth={3} className="shrink-0 text-[#ff4b12] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Step 2 of the hub: pick your stage on the route and see which counters matter now. */
function JourneyStage() {
  const [stage, setStage] = useState(0);
  const current = JOURNEY_STAGES[stage];
  const progress = (stage / (JOURNEY_STAGES.length - 1)) * 100;

  return (
    <section id="stage" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-20 pt-10 text-[#071f50] sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          steps={HUB_STEPS}
          step={2}
          title="Where are you right now?"
          accent="We'll show the counters that matter."
          text="Studying abroad goes in five stops. Most students only need two or three counters at a time."
          howTo="Tap the stop that sounds like you. The counters below change to match."
        />

        {/* The route */}
        <div className="relative mt-16">
          {/* Track from the first stop's centre to the last one's, with the plane on it */}
          <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-[20px] hidden h-1 rounded-full bg-[#071f50]/10 md:block">
            <motion.div
              className="h-full rounded-full bg-[#ff4b12]"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
            <motion.span
              className="absolute -top-[52px] grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-[#071f50] text-white shadow-lg"
              animate={{ left: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            >
              <Plane size={17} className="rotate-45" />
            </motion.span>
          </div>

          <ol className="relative grid gap-2 md:grid-cols-5 md:gap-0">
            {JOURNEY_STAGES.map((item, index) => {
              const active = index === stage;
              const passed = index < stage;
              return (
                <li key={item.id} className="md:text-center">
                  <button
                    type="button"
                    onClick={() => setStage(index)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition md:flex-col md:gap-2 md:rounded-none md:bg-transparent md:p-0 md:text-center ${
                      active ? "bg-white ring-1 ring-[#ff4b12]/40 md:ring-0" : "bg-white/60 md:bg-transparent"
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-4 font-mono text-sm font-black transition ${
                        active
                          ? "scale-110 border-[#ff4b12] bg-white text-[#ff4b12]"
                          : passed
                            ? "border-[#ff4b12] bg-[#ff4b12] text-white"
                            : "border-[#071f50]/15 bg-[#fff7ed] text-[#7a879c]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className={`text-sm font-black ${active ? "text-[#ff4b12]" : ""}`}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mt-10"
          >
            <p className="mx-auto max-w-2xl rounded-2xl bg-white px-5 py-4 text-center text-base font-bold leading-7 ring-1 ring-orange-100">
              &ldquo;{current.text}&rdquo;
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {GROUPS.map((group) => {
                const services = COUNTERS.filter((service) => groupFor(service, stage) === group.id);
                return (
                  <div key={group.id} className="rounded-[26px] bg-[#071f50]/[0.04] p-4">
                    <div className={`rounded-2xl px-4 py-3 ${group.tone}`}>
                      <p className="text-lg font-black tracking-[-0.02em]">{group.title}</p>
                      <p className="text-xs font-bold opacity-75">{group.note}</p>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {services.length ? (
                        services.map((service) => <CounterChip key={service.slug} service={service} stage={stage} />)
                      ) : (
                        <p className="rounded-2xl border-2 border-dashed border-[#071f50]/10 px-4 py-5 text-center text-sm font-bold text-[#7a879c]">
                          {group.id === "earlier" ? "Nothing behind you yet. You're at the very start." : "Nothing after this. Next stop: your flight."}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export default JourneyStage;
