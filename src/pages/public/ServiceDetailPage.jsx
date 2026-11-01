import { useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { AnimatePresence, useInView } from "framer-motion";

import NotFoundPage from "./NotFoundPage.jsx";
import { DripDivider, ZAIFAN_NAVY, ZAIFAN_ORANGE } from "../../components/public/destinations/DestinationUI";
import CounterHero from "../../components/public/services/CounterHero";
import FitTap from "../../components/public/services/FitTap";
import ProcessRoute from "../../components/public/services/ProcessRoute";
import SecurityScan from "../../components/public/services/SecurityScan";
import ReadyDesk from "../../components/public/services/ReadyDesk";
import ServiceDock from "../../components/public/services/ServiceDock";
import useActiveStep from "../../components/public/services/useActiveStep";
import { DETAIL_STEPS, appointmentHref, getCounter } from "../../components/public/services/serviceMeta";

const CREAM = "#fff7ed";

// One page per service counter: a hero, then four labelled steps (is it for
// me, how it works, what we check, get ready + FAQs). Cream alternates with
// navy and orange, with a drip at every change.
function ServiceDetailPage() {
  const { serviceSlug } = useParams();
  const location = useLocation();
  const service = getCounter(serviceSlug);
  const activeStep = useActiveStep(DETAIL_STEPS, serviceSlug);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { amount: 0.2 });

  useEffect(() => {
    if (service) document.title = `${service.title} | Zaifan Consultancy`;
  }, [service]);

  useEffect(() => {
    if (!location.hash) return undefined;
    const timer = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" }), 300);
    return () => window.clearTimeout(timer);
  }, [location.hash, serviceSlug]);

  if (!service) return <NotFoundPage />;

  return (
    // Keyed by service so every step's choices reset when you switch counters.
    <main key={service.slug} className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      <div ref={heroRef}>
        <CounterHero service={service} />
      </div>
      <DripDivider background={ZAIFAN_NAVY} />
      <FitTap service={service} />
      <DripDivider color={ZAIFAN_NAVY} background={CREAM} />
      <ProcessRoute service={service} />
      <DripDivider background={ZAIFAN_ORANGE} />
      <SecurityScan service={service} />
      <DripDivider color={ZAIFAN_ORANGE} background={CREAM} />
      <ReadyDesk service={service} />

      <AnimatePresence>
        {!heroInView && <ServiceDock steps={DETAIL_STEPS} active={activeStep} bookHref={appointmentHref(service)} />}
      </AnimatePresence>
    </main>
  );
}

export default ServiceDetailPage;
