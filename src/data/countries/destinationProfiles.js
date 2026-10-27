// Judgement-call profiles used by the home page tools and the Countries
// filters. Kept apart from the country data files because they are our
// advice about each destination, not facts about it.

// Quick-filter traits.
export const COUNTRY_TRAITS = {
  italy: ["eu", "lowTuition", "scholarships", "english", "postStudy"],
  germany: ["eu", "lowTuition", "english", "postStudy"],
  france: ["eu", "english", "postStudy"],
  belgium: ["eu", "english", "postStudy"],
  romania: ["eu", "lowTuition", "medicine", "english"],
  lithuania: ["eu", "english", "postStudy", "medicine"],
  turkey: ["lowTuition", "scholarships", "english", "medicine"],
  china: ["scholarships", "english", "medicine"],
  vietnam: ["lowTuition", "english"],
};

export const TRAIT_LABELS = {
  eu: "EU & Schengen",
  lowTuition: "Low tuition",
  scholarships: "Big scholarships",
  english: "English-taught",
  postStudy: "Work after study",
  medicine: "Medicine",
};

// Subjects each destination is especially strong or popular for, strongest first.
export const COUNTRY_SUBJECTS = {
  italy: ["design", "engineering", "business", "medicine", "sciences"],
  germany: ["engineering", "computing", "sciences", "business"],
  france: ["business", "design", "sciences", "computing"],
  belgium: ["business", "sciences", "medicine"],
  romania: ["medicine", "engineering", "computing"],
  lithuania: ["computing", "business", "medicine"],
  turkey: ["engineering", "medicine", "business"],
  china: ["engineering", "medicine", "computing", "sciences"],
  vietnam: ["business", "computing", "engineering"],
};

export const SUBJECTS = [
  { id: "engineering", label: "Engineering" },
  { id: "computing", label: "Computer Science & IT" },
  { id: "business", label: "Business & Economics" },
  { id: "medicine", label: "Medicine & Health" },
  { id: "design", label: "Design & Architecture" },
  { id: "sciences", label: "Natural Sciences" },
];

// Rough yearly cost level (tuition + living) for a typical public-university
// student: 1 = lower, 2 = middle, 3 = higher.
export const COST_LEVEL = {
  italy: 2,
  germany: 2,
  france: 2,
  belgium: 3,
  romania: 1,
  lithuania: 2,
  turkey: 1,
  china: 2,
  vietnam: 1,
};

// The usual arrival airport and student city for each destination, for the
// home page's departure-board theme.
export const GATEWAYS = {
  italy: { airport: "MXP", city: "Milan" },
  germany: { airport: "MUC", city: "Munich" },
  france: { airport: "CDG", city: "Paris" },
  belgium: { airport: "BRU", city: "Brussels" },
  romania: { airport: "OTP", city: "Bucharest" },
  lithuania: { airport: "VNO", city: "Vilnius" },
  turkey: { airport: "IST", city: "Istanbul" },
  china: { airport: "PVG", city: "Shanghai" },
  vietnam: { airport: "HAN", city: "Hanoi" },
};
