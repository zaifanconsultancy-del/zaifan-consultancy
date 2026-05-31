function OpportunityFeedPanel({ students = [] }) {
  const opportunities = students
    .filter((student) => {
      const conversion = Number(student?.gpt_conversion || student?.lead_score || 0);
      const priority = String(student?.priority || "").toLowerCase();

      return conversion > 60 || priority === "vip" || priority === "high";
    })
    .slice(0, 5);

  return (
    <div className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-500/[0.03] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-white">Opportunity Feed</h3>

          <p className="mt-2 text-sm text-white/45">
            High conversion students and valuable lead opportunities.
          </p>
        </div>

        <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
          {opportunities.length} Opportunities
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {opportunities.length ? (
          opportunities.map((student) => {
            const name = student?.full_name || student?.name || "Unknown Student";
            const conversion = Number(
              student?.gpt_conversion || student?.lead_score || 0
            );

            return (
              <div
                key={student.id || name}
                className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{name}</p>

                    <p className="mt-1 text-sm text-emerald-300">
                      Conversion potential: {conversion || "Manual review"}%
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
          <p className="text-white/50">No opportunities detected.</p>
        )}
      </div>
    </div>
  );
}

export default OpportunityFeedPanel;