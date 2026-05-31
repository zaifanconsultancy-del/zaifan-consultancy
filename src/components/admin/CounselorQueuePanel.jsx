import { useMemo } from "react";

function CounselorQueuePanel({ student = {} }) {
  const queue = useMemo(() => {
    const fullName = student?.full_name || student?.name || "Student";

    const items = [];

    if (student?.priority === "vip" || student?.priority === "high") {
      items.push({
        title: `Call ${fullName}`,
        description: "High priority lead needs counselor attention.",
      });
    }

    if (student?.phone || student?.phone_number) {
      items.push({
        title: "WhatsApp student",
        description: "Send a quick progress update or document reminder.",
      });
    }

    if (student?.email) {
      items.push({
        title: "Email student",
        description: "Send application or document status email.",
      });
    }

    if (student?.gpt_risk) {
      items.push({
        title: "Review GPT risk",
        description: student.gpt_risk,
      });
    }

    return items.length
      ? items
      : [
          {
            title: "General counselor review",
            description: "Check profile and decide next action.",
          },
        ];
  }, [student]);

  return (
    <div className="rounded-[1.75rem] border border-blue-400/20 bg-blue-500/[0.03] p-6">
      <h3 className="font-bold text-white">Counselor Queue</h3>

      <div className="mt-5 space-y-3">
        {queue.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4"
          >
            <p className="font-semibold text-blue-300">{item.title}</p>
            <p className="mt-1 text-sm text-white/50">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CounselorQueuePanel;