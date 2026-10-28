import { italyMeta } from "./meta";

export const italyData = {
  ...italyMeta,

  routes: {
    countryGuide: "/countries/italy",
    universities: "/universities",
    scholarships: "/scholarships",
    appointment:
      "/appointment?country=Italy&service=Free Italy Study Plan",
  },

  stats: [
    { value: "50+", label: "Universities" },
    { value: "20+", label: "Student Cities" },
    { value: "DSU", label: "Scholarship Route" },
    { value: "Free", label: "Consultation" },
  ],

  highlights: [
    "Low public university tuition",
    "DSU and regional scholarship planning",
    "English-taught programs",
    "Historic student cities",
    "Strong Europe lifestyle and mobility",
    "Visa roadmap support",
  ],

  services: [
    "University Selection",
    "Scholarship Guidance",
    "Admission Guidance",
    "SOP & Documentation",
    "Visa Guidance",
    "Free Consultation",
  ],

  cities: [
    {
      name: "Milan",
      slug: "milan",
      type: "Business + Fashion + Career Hub",
      scholarshipBody: "DSU Lombardia",
      route: "/countries/italy/milan",
    },
    {
      name: "Rome",
      slug: "rome",
      type: "Historic Capital + Big University City",
      scholarshipBody: "LazioDisco",
      route: "/countries/italy/rome",
    },
    {
      name: "Bologna",
      slug: "bologna",
      type: "Classic Student City",
      scholarshipBody: "ER.GO",
      route: "/countries/italy/bologna",
    },
    {
      name: "Padua",
      slug: "padua",
      type: "Affordable Historic Student City",
      scholarshipBody: "Regional + University Support",
      route: "/countries/italy/padua",
    },
    {
      name: "Turin",
      slug: "turin",
      type: "Engineering + Industry Route",
      scholarshipBody: "EDISU Piemonte",
      route: "/countries/italy/turin",
    },
    {
      name: "Pisa",
      slug: "pisa",
      type: "Research + Tuscany Student Life",
      scholarshipBody: "DSU Toscana",
      route: "/countries/italy/pisa",
    },
  ],

  scholarshipEcosystem: {
    title: "Italy Scholarship Ecosystem",
    note:
      "DSU is part of the Italy scholarship ecosystem. It should not become a standalone page.",
    routes: [
      "DSU / Regional Scholarships",
      "University Awards",
      "Merit Scholarships",
      "Tuition Reductions",
      "Backup Funding Planning",
    ],
  },

  realityChecks: [
    { expectation: "Italy is cheap everywhere", reality: "Milan, Rome and Venice can create real budget pressure. City choice matters." },
    { expectation: "DSU is automatic", reality: "DSU depends on eligibility, ranking, documents, regional portals and deadlines." },
    { expectation: "All Italian cities feel the same", reality: "Milan, Bologna, Padua, Rome, Turin and Pisa give very different student lives." },
    { expectation: "Part-time work solves everything", reality: "Work can help, but the core plan needs tuition, rent, food, documents and backup budget." },
    { expectation: "University ranking is enough", reality: "Course fit, language, deadlines, scholarship route and city comfort matter just as much." },
    { expectation: "Documents can wait", reality: "Late income, property, family, translation or visa documents can damage the whole route." },
  ],

  honestyRules: [
    "No fake DSU guarantees",
    "No fake admission promises",
    "No fake visa guarantees",
    "Scholarship rules must be checked by region, deadline and documents",
  ],
};