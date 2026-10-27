// Broad career directions for each programme family. Used on university and
// city pages to show where a subject usually leads; deliberately general,
// because outcomes depend on the student, the degree and the job market.
const FAMILIES = [
  {
    id: "engineering",
    title: "Engineering & industry",
    icon: "cpu",
    programs: [
      "Engineering", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Chemical Engineering",
      "Industrial Engineering", "Automotive", "Aerospace", "Aviation", "Automation", "Robotics", "Materials", "Energy",
      "Naval Engineering", "Microelectronics", "Electronics", "Optoelectronics", "Optics", "Communication Engineering",
      "Geodesy", "Remote Sensing",
    ],
    roles: ["Design and R&D engineer", "Manufacturing and quality roles", "Energy and infrastructure projects", "Technical consulting"],
  },
  {
    id: "computing",
    title: "Tech, data & AI",
    icon: "cpu",
    programs: ["Computer Science", "AI", "Data Science", "IT", "Software Engineering", "Computing", "Applied Maths", "Mathematics"],
    roles: ["Software developer", "Data analyst or data scientist", "Machine learning engineer", "IT and cybersecurity roles"],
  },
  {
    id: "business",
    title: "Business, finance & trade",
    icon: "briefcase",
    programs: ["Business", "Management", "MBA", "Finance", "Economics", "Entrepreneurship", "International Trade", "Tourism"],
    roles: ["Finance and banking", "Consulting and business analysis", "Marketing and operations", "Starting your own venture"],
  },
  {
    id: "health",
    title: "Medicine & health",
    icon: "stethoscope",
    programs: [
      "Medicine", "MBBS", "Dentistry", "Pharmacy", "Nursing", "Health", "Health Care", "Health Sciences", "Public Health",
      "Epidemiology", "Physiotherapy", "Tropical Medicine", "Veterinary",
    ],
    roles: ["Clinical practice after licensing exams", "Public health and research", "Pharma and healthcare management", "Further specialisation abroad"],
  },
  {
    id: "science",
    title: "Science & research",
    icon: "graduation",
    programs: [
      "Physics", "Chemistry", "Biology", "Bioscience", "Life Sciences", "Sciences", "Environmental Science", "Climate Science",
      "Ecology", "Marine Science", "Marine Studies", "Aquaculture", "Agriculture", "Forestry",
    ],
    roles: ["PhD and research positions", "Laboratory and industry R&D", "Environmental and climate roles", "Science policy and teaching"],
  },
  {
    id: "society",
    title: "Law, policy & society",
    icon: "landmark",
    programs: [
      "Law", "Political Science", "International Relations", "International Affairs", "Social Sciences", "Humanities",
      "Psychology", "Public Administration", "Education", "Theology", "Liberal Arts", "Sports Science",
    ],
    roles: ["Policy, NGOs and international organisations", "Legal and compliance roles", "Research and teaching", "Public sector careers"],
  },
  {
    id: "media",
    title: "Media, languages & communication",
    icon: "languages",
    programs: ["Communication", "Journalism", "Media", "Languages", "Translation"],
    roles: ["Journalism and content", "Translation and interpreting", "Marketing communication", "International relations support"],
  },
  {
    id: "creative",
    title: "Design, architecture & arts",
    icon: "sparkles",
    programs: ["Architecture", "Design", "Arts", "Fine Arts", "Music", "Urban Planning"],
    roles: ["Architecture and urban design studios", "Product, interior and graphic design", "Creative and cultural industries", "Freelance and portfolio careers"],
  },
];

/** Career families that match at least one of the programmes, best match first. */
export function getCareerFamilies(programs = [], limit = 3) {
  return FAMILIES.map((family) => ({
    ...family,
    matches: programs.filter((program) => family.programs.includes(program)),
  }))
    .filter((family) => family.matches.length)
    .sort((a, b) => b.matches.length - a.matches.length)
    .slice(0, limit);
}
