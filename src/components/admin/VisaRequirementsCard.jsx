const requirements = [
  {
    name: "Passport",
    matches: ["Passport"],
  },
  {
    name: "Offer Letter",
    matches: ["Offer Letter", "Offer", "Admission Letter"],
  },
  {
    name: "IELTS / English Test",
    matches: ["IELTS", "PTE", "English Test"],
  },
  {
    name: "Financial Statement",
    matches: ["Financial Documents", "Financial Statement", "Bank Statement"],
  },
  {
    name: "Medical",
    matches: ["Medical"],
  },
  {
    name: "Police Clearance",
    matches: ["Police Clearance", "Police Certificate"],
  },
];

function VisaRequirementsCard({ student = {} }) {
  const documents = student?.documents || student?.application?.documents || [];

  const getRequirementStatus = (requirement) => {
    const matched = documents.find((doc) =>
      requirement.matches.some((name) =>
        String(doc?.document_name || "")
          .toLowerCase()
          .includes(name.toLowerCase())
      )
    );

    return matched?.status || "missing";
  };

  const getStatusClass = (status) => {
    if (status === "verified") {
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
    }

    if (status === "received") {
      return "border-blue-400/25 bg-blue-500/10 text-blue-300";
    }

    if (status === "rejected") {
      return "border-red-400/25 bg-red-500/10 text-red-300";
    }

    return "border-yellow-400/25 bg-yellow-500/10 text-yellow-300";
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-white">Visa Requirements</h3>
          <p className="mt-2 text-sm text-white/45">
            Visa readiness checklist based on available student documents.
          </p>
        </div>

        <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-300">
          Checklist
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {requirements.map((item) => {
          const status = getRequirementStatus(item);

          return (
            <div
              key={item.name}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white/80">{item.name}</p>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                    status
                  )}`}
                >
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VisaRequirementsCard;