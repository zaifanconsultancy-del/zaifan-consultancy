// UniversitySelector V2 — University Intelligence Shortlist
// Preserves destination-based university matching and fallback shortlist behavior.
// Visual layer aligned with the approved Zaifan Admin OS.

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
    <div className="rounded-[1.75rem] border border-slate-300 bg-white p-6 shadow-[0_8px_24px_rgba(15,35,63,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
            University Intelligence
          </p>

          <h3 className="mt-1 font-black text-[#10233f]">University Shortlist</h3>

          <p className="mt-2 text-sm text-slate-600">
            Suggested destination options based on the student's country preference.
          </p>
        </div>

        <span className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
          {targetCountry || "Global"} Match
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {finalUniversities.map((uni) => (
          <div
            key={uni.name}
            className="rounded-xl border border-slate-300 bg-[#fffaf2] p-4 transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-black text-[#10233f]">{uni.name}</p>

                <p className="mt-1 text-sm font-semibold text-slate-600">{uni.country}</p>

                <p className="mt-2 text-sm text-slate-500">
                  Strength: {uni.strength}
                </p>
              </div>

              <span className="rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-black text-orange-700">
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