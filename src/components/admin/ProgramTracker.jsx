function ProgramTracker({ student = {} }) {
  const program =
    student?.program ||
    student?.field_of_interest ||
    student?.course ||
    student?.study_field ||
    "Not Assigned";

  const intake =
    student?.intake ||
    student?.preferred_intake ||
    "Not Assigned";

  const scholarship = student?.scholarship || "Pending";
  const tuition =
    student?.tuition ||
    student?.tuition_fee ||
    "Not Available";

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
    <div className="overflow-hidden rounded-[1.75rem] border-2 border-orange-300 bg-white shadow-[0_10px_28px_rgba(15,35,63,0.05)]">
      <div className="flex flex-col gap-3 border-b border-orange-200 bg-[#102f5c] p-6 text-white sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
            Academic Planning
          </p>

          <h3 className="mt-1 font-black text-white">Program Information</h3>

          <p className="mt-2 text-sm text-slate-200">
            Track program, intake, scholarship, and tuition readiness.
          </p>
        </div>

        <span className="rounded-full border-2 border-orange-300 bg-orange-500 px-4 py-2 text-xs font-black text-white">
          {readiness}% Ready
        </span>
      </div>

      <div className="bg-[#fff8ee] p-6">
        <div className="h-2 overflow-hidden rounded-full border border-slate-300 bg-white">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
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
              className={`rounded-xl border-2 p-4 ${
                item.complete
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-amber-300 bg-amber-50"
              }`}
            >
              <p
                className={`text-sm font-black ${
                  item.complete
                    ? "text-emerald-700"
                    : "text-amber-800"
                }`}
              >
                {item.complete ? "Ready" : "Pending"} — {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-[0_4px_14px_rgba(15,35,63,0.03)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words font-black text-[#10233f]">{value}</p>
    </div>
  );
}

export default ProgramTracker;