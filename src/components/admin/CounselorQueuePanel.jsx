import { useMemo } from "react";

function CounselorQueuePanel({ student = {} }) {
  const queue = useMemo(() => {
    const fullName = student?.full_name || student?.name || "Student";

    const documents = Array.isArray(student?.documents)
      ? student.documents
      : [];

    const tasks = Array.isArray(student?.tasks)
      ? student.tasks
      : [];

    const universities = Array.isArray(student?.universities)
      ? student.universities
      : [];

    const communications = Array.isArray(student?.communications)
      ? student.communications
      : [];

    const application = student?.application || null;

    const items = [];

    const passport = documents.find(
      (doc) =>
        String(doc.document_name || "").toLowerCase() === "passport"
    );

    const ielts = documents.find(
      (doc) =>
        String(doc.document_name || "").toLowerCase() === "ielts"
    );

    const overdueTasks = tasks.filter((task) => {
      if (!task?.due_date || task.status === "completed") {
        return false;
      }

      return new Date(task.due_date) < new Date();
    });

    if (student?.priority === "vip" || student?.priority === "high") {
      items.push({
        title: `Priority Review: ${fullName}`,
        description:
          "High-priority student requires counselor attention.",
        level: "critical",
      });
    }

    if (!passport || passport.status === "missing") {
      items.push({
        title: "Collect Passport",
        description:
          "Passport document is missing from the student profile.",
        level: "high",
      });
    }

    if (!ielts || ielts.status === "missing") {
      items.push({
        title: "Collect IELTS Result",
        description:
          "Language test result is missing and may block applications.",
        level: "high",
      });
    }

    if (universities.length === 0) {
      items.push({
        title: "Build University Shortlist",
        description:
          "No universities have been saved for this student.",
        level: "medium",
      });
    }

    if (!application) {
      items.push({
        title: "Create Application Record",
        description:
          "Student does not yet have an application profile.",
        level: "medium",
      });
    }

    if (overdueTasks.length > 0) {
      items.push({
        title: "Resolve Overdue Tasks",
        description: `${overdueTasks.length} overdue task(s) require attention.`,
        level: "critical",
      });
    }

    if (communications.length === 0) {
      items.push({
        title: "First Student Follow-up",
        description:
          "No communication history found for this student.",
        level: "medium",
      });
    }

    if (
      application?.offer_status === "offer_received" &&
      application?.visa_status === "not_started"
    ) {
      items.push({
        title: "Start Visa Workflow",
        description:
          "Offer received but visa process has not started.",
        level: "high",
      });
    }

    if (student?.gpt_risk) {
      items.push({
        title: "Review AI Risk Assessment",
        description: student.gpt_risk,
        level: "high",
      });
    }

    return items.length
      ? items
      : [
          {
            title: "Student Operating Normally",
            description:
              "No urgent counselor actions detected.",
            level: "stable",
          },
        ];
  }, [student]);

  return (
    <div className="rounded-[1.75rem] border border-blue-400/20 bg-blue-500/[0.03] p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">
          Counselor Queue
        </h3>

        <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-300">
          {queue.length} Items
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {queue.map((item) => (
          <div
            key={item.title}
            className={`rounded-xl border p-4 ${getQueueStyle(
              item.level
            )}`}
          >
            <p className="font-semibold text-white">
              {item.title}
            </p>

            <p className="mt-1 text-sm text-white/55">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getQueueStyle(level = "") {
  if (level === "critical") {
    return "border-red-400/25 bg-red-500/10";
  }

  if (level === "high") {
    return "border-orange-400/25 bg-orange-500/10";
  }

  if (level === "medium") {
    return "border-blue-400/25 bg-blue-500/10";
  }

  return "border-emerald-400/25 bg-emerald-500/10";
}

export default CounselorQueuePanel;