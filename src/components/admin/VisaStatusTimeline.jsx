const stages = [
  {
    id: "not_started",
    label: "Not Started",
    description: "Visa process has not started yet.",
  },
  {
    id: "visa_processing",
    label: "Visa Processing",
    description: "Visa file preparation has started.",
  },
  {
    id: "biometrics",
    label: "Biometrics",
    description: "Biometrics appointment or submission required.",
  },
  {
    id: "medical",
    label: "Medical",
    description: "Medical test or health documentation required.",
  },
  {
    id: "under_review",
    label: "Under Review",
    description: "Visa application is under embassy review.",
  },
  {
    id: "visa_approved",
    label: "Approved",
    description: "Visa decision approved.",
  },
  {
    id: "rejected",
    label: "Rejected",
    description: "Visa application rejected or requires urgent review.",
  },
];

function VisaStatusTimeline({ status = "not_started" }) {
  const current = Math.max(
    stages.findIndex((stage) => stage.id === status),
    0
  );

  const isRejected = status === "rejected";

  return (
    <div className="rounded-[1.75rem] border border-slate-300 bg-white p-6 shadow-[0_8px_24px_rgba(15,35,63,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
            Visa Progress
          </p>
          <h3 className="mt-1 font-black text-[#10233f]">Visa Timeline</h3>
          <p className="mt-2 text-sm text-slate-600">
            Track every visa milestone from preparation to final decision.
          </p>
        </div>

        <span
          className={`rounded-full border px-4 py-2 text-xs font-black capitalize ${
            isRejected
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-orange-300 bg-orange-50 text-orange-700"
          }`}
        >
          {status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {stages.map((stage, index) => {
          const active = isRejected
            ? stage.id === "rejected"
            : index <= current && stage.id !== "rejected";

          return (
            <div
              key={stage.id}
              className={`rounded-xl border p-4 transition ${
                active
                  ? isRejected
                    ? "border-red-300 bg-red-50"
                    : "border-orange-300 bg-[#fff8ee]"
                  : "border-slate-300 bg-[#fffdf9]"
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
                    active
                      ? isRejected
                        ? "border-red-400 bg-red-600 text-white"
                        : "border-orange-500 bg-orange-500 text-white"
                      : "border-slate-300 bg-white text-slate-500"
                  }`}
                >
                  {index + 1}
                </span>

                <div>
                  <p className="font-black text-[#10233f]">{stage.label}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {stage.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VisaStatusTimeline;