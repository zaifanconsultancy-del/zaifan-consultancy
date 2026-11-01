import { serviceCatalog } from "../../../data/servicesData";

// The services pages are an airport check-in hall: every service is a counter,
// numbered in the order a student usually needs them.
const META = {
  "free-consultation": {
    counter: 1,
    code: "START",
    problem: "I don't know where to start.",
    stage: 0,
    anyStage: true,
  },
  "university-selection": {
    counter: 2,
    code: "UNI",
    problem: "I can't decide which university or city.",
    stage: 1,
  },
  "scholarship-guidance": {
    counter: 3,
    code: "FUND",
    problem: "I need a scholarship to afford this.",
    stage: 2,
  },
  "admission-guidance": {
    counter: 4,
    code: "APPLY",
    problem: "Portals and deadlines are confusing me.",
    stage: 3,
  },
  "sop-documentation": {
    counter: 5,
    code: "DOCS",
    problem: "My SOP, CV and papers are a mess.",
    stage: 3,
  },
  "visa-guidance": {
    counter: 6,
    code: "VISA",
    problem: "I have an offer. Now the visa scares me.",
    stage: 4,
  },
};

export const COUNTERS = serviceCatalog
  .map((service) => ({ ...service, ...META[service.slug] }))
  .sort((a, b) => a.counter - b.counter);

export function getCounter(slug) {
  return COUNTERS.find((service) => service.slug === slug);
}

export function counterLabel(service) {
  return `Counter ${String(service.counter).padStart(2, "0")}`;
}

export function appointmentHref(service) {
  return `/appointment?service=${encodeURIComponent(service.title)}`;
}

// Where a student can be in the journey; each counter belongs to one stage.
export const JOURNEY_STAGES = [
  { id: "start", label: "Just starting", text: "I like the idea of studying abroad but haven't picked anything yet." },
  { id: "shortlist", label: "Choosing universities", text: "I have a country or two in mind and need a shortlist." },
  { id: "funding", label: "Finding the money", text: "I know where I want to go. Now I need to make it affordable." },
  { id: "applying", label: "Applying", text: "I'm filling in portals, writing an SOP and collecting papers." },
  { id: "offer", label: "Got an offer", text: "A university said yes. Visa, money proof and travel are next." },
];

export const HUB_STEPS = [
  { id: "counters", label: "Pick a counter" },
  { id: "stage", label: "Where are you?" },
  { id: "promise", label: "Our promise" },
  { id: "prepare", label: "Get ready" },
];

export const DETAIL_STEPS = [
  { id: "fit", label: "Is it for me?" },
  { id: "how", label: "How it works" },
  { id: "checks", label: "What we check" },
  { id: "ready", label: "Get ready" },
];

export const WHATSAPP_NUMBER = "923305718131";

export function whatsappLink(text) {
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(text)}`;
}
