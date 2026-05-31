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
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-white">Visa Timeline</h3>
          <p className="mt-2 text-sm text-white/45">
            Track every visa milestone from preparation to decision.
          </p>
        </div>

        <span
          className={`rounded-full border px-4 py-2 text-xs font-black ${
            isRejected
              ? "border-red-400/25 bg-red-500/10 text-red-300"
              : "border-cyan-400/25 bg-cyan-500/10 text-cyan-300"
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
              className={`rounded-xl border p-4 ${
                active
                  ? isRejected
                    ? "border-red-400/30 bg-red-500/10"
                    : "border-cyan-400/30 bg-cyan-500/10"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
                    active
                      ? isRejected
                        ? "border-red-400/30 text-red-300"
                        : "border-cyan-400/30 text-cyan-300"
                      : "border-white/10 text-white/30"
                  }`}
                >
                  {index + 1}
                </span>

                <div>
                  <p className="font-semibold text-white">{stage.label}</p>
                  <p className="mt-1 text-sm text-white/45">
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