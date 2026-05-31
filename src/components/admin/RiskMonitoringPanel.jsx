function RiskMonitoringPanel({ students = [] }) {
  const riskyStudents = students
    .filter((student) => {
      const risk = String(student?.gpt_risk || student?.risk_level || "").toLowerCase();
      const priority = String(student?.priority || "").toLowerCase();

      return risk || priority === "high" || priority === "vip";
    })
    .slice(0, 5);

  return (
    <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/[0.03] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-white">Risk Monitoring</h3>

          <p className="mt-2 text-sm text-white/45">
            Students needing urgent counselor attention.
          </p>
        </div>

        <span className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300">
          {riskyStudents.length} Risk
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {riskyStudents.length ? (
          riskyStudents.map((student) => {
            const name = student?.full_name || student?.name || "Unknown Student";

            return (
              <div
                key={student.id || name}
                className="rounded-xl border border-red-400/20 bg-red-500/10 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{name}</p>

                    <p className="mt-1 text-sm text-red-300">
                      {student?.gpt_risk ||
                        student?.risk_level ||
                        "High priority profile requires manual review."}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold capitalize text-white/50">
                    {student?.priority || "standard"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-white/50">No risks detected.</p>
        )}
      </div>
    </div>
  );
}

export default RiskMonitoringPanel;