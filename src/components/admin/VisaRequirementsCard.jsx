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
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    }

    if (status === "received") {
      return "border-blue-300 bg-blue-50 text-blue-700";
    }

    if (status === "rejected") {
      return "border-red-300 bg-red-50 text-red-700";
    }

    return "border-amber-300 bg-amber-50 text-amber-800";
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-300 bg-white p-6 shadow-[0_8px_24px_rgba(15,35,63,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
            Visa Readiness
          </p>
          <h3 className="mt-1 font-black text-[#10233f]">Visa Requirements</h3>
          <p className="mt-2 text-sm text-slate-600">
            Visa readiness checklist based on available student documents.
          </p>
        </div>

        <span className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
          Checklist
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {requirements.map((item) => {
          const status = getRequirementStatus(item);

          return (
            <div
              key={item.name}
              className="rounded-xl border border-slate-300 bg-[#fffaf2] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-[#10233f]">{item.name}</p>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getStatusClass(
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