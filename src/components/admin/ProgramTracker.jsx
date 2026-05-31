function ProgramTracker({ student = {} }) {
  const program =
    student?.program ||
    student?.field_of_interest ||
    student?.course ||
    student?.study_field ||
    "Not Assigned";

  const intake = student?.intake || student?.preferred_intake || "Not Assigned";
  const scholarship = student?.scholarship || "Pending";
  const tuition = student?.tuition || student?.tuition_fee || "Not Available";

  const readinessItems = [
    {
      label: "Program Selected",
      complete: program !== "Not Assigned",
    },
    {
      label: "Intake Selected",
      complete: intake !== "Not Assigned",
    },
    {
      label: "Scholarship Checked",
      complete: scholarship !== "Pending",
    },
    {
      label: "Tuition Known",
      complete: tuition !== "Not Available",
    },
  ];

  const completed = readinessItems.filter((item) => item.complete).length;
  const readiness = Math.round((completed / readinessItems.length) * 100);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-white">Program Information</h3>

          <p className="mt-2 text-sm text-white/45">
            Track program, intake, scholarship, and tuition readiness.
          </p>
        </div>

        <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black text-[#D4AF37]">
          {readiness}% Ready
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#D4AF37]"
          style={{ width: `${readiness}%` }}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoCard label="Program" value={program} />
        <InfoCard label="Intake" value={intake} />
        <InfoCard label="Scholarship" value={scholarship} />
        <InfoCard label="Tuition" value={tuition} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {readinessItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl border p-4 ${
              item.complete
                ? "border-emerald-400/20 bg-emerald-500/10"
                : "border-yellow-400/20 bg-yellow-500/10"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                item.complete ? "text-emerald-300" : "text-yellow-300"
              }`}
            >
              {item.complete ? "Ready" : "Pending"} — {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-2 break-words font-semibold text-white">{value}</p>
    </div>
  );
}

export default ProgramTracker;