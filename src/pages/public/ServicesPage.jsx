import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, useInView } from "framer-motion";

import { DripDivider, ZAIFAN_NAVY, ZAIFAN_ORANGE } from "../../components/public/destinations/DestinationUI";
import TicketHero from "../../components/public/services/TicketHero";
import CounterHall from "../../components/public/services/CounterHall";
import JourneyStage from "../../components/public/services/JourneyStage";
import PromiseBoard from "../../components/public/services/PromiseBoard";
import HubPrepare from "../../components/public/services/HubPrepare";
import ServiceDock from "../../components/public/services/ServiceDock";
import useActiveStep from "../../components/public/services/useActiveStep";
import { COUNTERS, HUB_STEPS } from "../../components/public/services/serviceMeta";

const CREAM = "#fff7ed";

// The services hub as a check-in hall: a ticket machine hero, then four
// labelled steps (counters, your stage, who does what, get ready + FAQs).
// The counter picked anywhere on the page is shared by every step.
export default function ServicesPage() {
  const location = useLocation();
  const [selected, setSelected] = useState(COUNTERS[0].slug);
  const activeStep = useActiveStep(HUB_STEPS);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { amount: 0.2 });

  useEffect(() => {
    document.title = "Services | Zaifan Consultancy";
  }, []);

  useEffect(() => {
    if (!location.hash) return undefined;
    const timer = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" }), 300);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return (
    <main className="overflow-x-clip bg-[#fff7ed] text-[#071f50]">
      <div ref={heroRef}>
        <TicketHero onPick={setSelected} />
      </div>
      <DripDivider background={ZAIFAN_NAVY} />
      <CounterHall selected={selected} onSelect={setSelected} />
      <DripDivider color={ZAIFAN_NAVY} background={CREAM} />
      <JourneyStage />
      <DripDivider background={ZAIFAN_ORANGE} />
      <PromiseBoard />
      <DripDivider color={ZAIFAN_ORANGE} background={CREAM} />
      <HubPrepare selected={selected} onSelect={setSelected} />

      <AnimatePresence>
        {!heroInView && <ServiceDock steps={HUB_STEPS} active={activeStep} bookHref="/appointment?service=Free%20Consultation" />}
      </AnimatePresence>
    </main>
  );
}
