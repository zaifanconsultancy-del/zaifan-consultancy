const universities = [
  {
    name: "University of Toronto",
    country: "Canada",
    strength: "Research, Business, Engineering",
    fit: "Premium",
  },
  {
    name: "University of British Columbia",
    country: "Canada",
    strength: "Science, Technology, Management",
    fit: "Premium",
  },
  {
    name: "University of Melbourne",
    country: "Australia",
    strength: "Business, Health, IT",
    fit: "Premium",
  },
  {
    name: "University of Sydney",
    country: "Australia",
    strength: "Business, Engineering, Medicine",
    fit: "Premium",
  },
  {
    name: "University of Manchester",
    country: "United Kingdom",
    strength: "Business, Engineering, Social Sciences",
    fit: "Strong",
  },
];

function UniversitySelector({ student = {} }) {
  const targetCountry =
    student?.country ||
    student?.preferred_country ||
    student?.country_interest ||
    "";

  const suggestedUniversities = targetCountry
    ? universities.filter((uni) =>
        uni.country.toLowerCase().includes(targetCountry.toLowerCase())
      )
    : universities;

  const finalUniversities = suggestedUniversities.length
    ? suggestedUniversities
    : universities;

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-white">University Shortlist</h3>

          <p className="mt-2 text-sm text-white/45">
            Suggested destination options based on student profile.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/50">
          {targetCountry || "Global"} Match
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {finalUniversities.map((uni) => (
          <div
            key={uni.name}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#D4AF37]/25 hover:bg-white/[0.04]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-white">{uni.name}</p>

                <p className="mt-1 text-sm text-white/50">{uni.country}</p>

                <p className="mt-2 text-sm text-white/40">
                  Strength: {uni.strength}
                </p>
              </div>

              <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold text-[#D4AF37]">
                {uni.fit} Fit
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UniversitySelector;