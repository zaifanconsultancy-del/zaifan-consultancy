// "Study in the EU" hub: explains what an EU study route gives a Pakistani
// student and links to every EU destination we cover.

export const euHubData = {
  slug: "european-union",
  name: "European Union",
  flag: "🇪🇺",
  headline: "Study in the European Union",
  tagline: "One student visa, a whole continent of opportunity.",
  intro:
    "Studying in an EU country gives you a recognised European degree, short-stay travel across the Schengen area and a path into one of the world's biggest job markets. Each country runs its own admissions and visas, so the right choice depends on your budget, subject and career plan.",

  benefits: [
    {
      icon: "plane",
      title: "Schengen travel",
      text: "A residence permit from a Schengen country lets you visit other Schengen countries for up to 90 days in any 180-day period.",
    },
    {
      icon: "graduation",
      title: "Recognised degrees (ECTS)",
      text: "The Bologna Process and ECTS credits make degrees and credits comparable across Europe.",
    },
    {
      icon: "award",
      title: "Erasmus+ & Erasmus Mundus",
      text: "Exchange semesters for enrolled students, and fully funded Erasmus Mundus Joint Masters across several countries.",
    },
    {
      icon: "briefcase",
      title: "EU Blue Card",
      text: "Graduates with a qualifying job offer can apply for the EU Blue Card, a residence and work permit for highly skilled workers.",
    },
  ],

  importantNotes: [
    "Your student visa is national: you apply to the country where you will study.",
    "Schengen travel is for short visits only. It does not let you study or work in another country.",
    "Post-study job search permits differ by country, from about 9–12 months up to 18 months in Germany.",
    "Each country sets its own tuition, proof-of-funds amount and work-hour rules.",
  ],

  erasmusMundus: {
    title: "Erasmus Mundus Joint Masters",
    text:
      "Highly competitive, fully funded master's programmes run by groups of European universities. Scholarships typically cover tuition, travel and a monthly living allowance, and you study in at least two countries.",
    link: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
  },

  memberSlugs: ["italy", "germany", "france", "belgium", "romania", "lithuania"],

  faqs: [
    {
      q: "Can I study in one EU country and work in another?",
      a: "No. Your residence permit is tied to the country where you study. You can travel short-term across Schengen, but working elsewhere needs that country's permit.",
    },
    {
      q: "Which EU country is cheapest?",
      a: "For tuition, Germany's public universities are often close to free; for overall cost, Romania and Lithuania are among the most affordable. Italy combines low income-based fees with DSU scholarships.",
    },
    {
      q: "Is Romania in Schengen now?",
      a: "Yes. Romania became a full Schengen member in January 2025.",
    },
  ],

  lastReviewed: "October 2026",
};
