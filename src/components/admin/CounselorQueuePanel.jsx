import { useMemo } from "react";

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function CounselorQueuePanel({ student = {} }) {
  const queue = useMemo(() => {
    const fullName = student?.full_name || student?.name || "Student";
    const documents = Array.isArray(student?.documents) ? student.documents : [];
    const tasks = Array.isArray(student?.tasks) ? student.tasks : [];
    const universities = Array.isArray(student?.universities)
      ? student.universities
      : [];
    const communications = Array.isArray(student?.communications)
      ? student.communications
      : [];
    const application = student?.application || null;
    const items = [];

    const passport = documents.find(
      (doc) => normalize(doc.document_name) === "passport"
    );

    const ielts = documents.find(
      (doc) => normalize(doc.document_name) === "ielts"
    );

    const overdueTasks = tasks.filter((task) => {
      if (!task?.due_date || normalize(task.status) === "completed") return false;
      const due = new Date(task.due_date);
      return !Number.isNaN(due.getTime()) && due < new Date();
    });

    if (["vip", "high"].includes(normalize(student?.priority))) {
      items.push({
        title: `Priority Review: ${fullName}`,
        description: "High-priority student requires counselor attention.",
        level: "critical",
        category: "Priority",
      });
    }

    if (!passport || normalize(passport.status) === "missing") {
      items.push({
        title: "Collect Passport",
        description: "Passport document is missing from the student profile.",
        level: "high",
        category: "Documents",
      });
    }

    if (!ielts || normalize(ielts.status) === "missing") {
      items.push({
        title: "Collect IELTS Result",
        description:
          "Language test evidence is missing and may block applications.",
        level: "high",
        category: "Documents",
      });
    }

    if (universities.length === 0) {
      items.push({
        title: "Build University Shortlist",
        description: "No universities have been saved for this student.",
        level: "medium",
        category: "Planning",
      });
    }

    if (!application) {
      items.push({
        title: "Create Application Record",
        description: "Student does not yet have an application profile.",
        level: "medium",
        category: "Application",
      });
    }

    if (overdueTasks.length > 0) {
      items.push({
        title: "Resolve Overdue Tasks",
        description: `${overdueTasks.length} overdue task(s) require attention.`,
        level: "critical",
        category: "Tasks",
      });
    }

    if (communications.length === 0) {
      items.push({
        title: "First Student Follow-up",
        description: "No communication history found for this student.",
        level: "medium",
        category: "Communication",
      });
    }

    if (
      normalize(application?.offer_status) === "offer_received" &&
      normalize(application?.visa_status) === "not_started"
    ) {
      items.push({
        title: "Start Visa Workflow",
        description: "Offer received but visa process has not started.",
        level: "high",
        category: "Visa",
      });
    }

    if (student?.gpt_risk) {
      items.push({
        title: "Review AI Risk Assessment",
        description: student.gpt_risk,
        level: "high",
        category: "AI Risk",
      });
    }

    return items.length
      ? items
      : [
          {
            title: "Student Operating Normally",
            description: "No urgent counselor actions detected.",
            level: "stable",
            category: "Stable",
          },
        ];
  }, [student]);

  const counts = useMemo(
    () => ({
      critical: queue.filter((item) => item.level === "critical").length,
      high: queue.filter((item) => item.level === "high").length,
      medium: queue.filter((item) => item.level === "medium").length,
      stable: queue.filter((item) => item.level === "stable").length,
    }),
    [queue]
  );

  return (
    <section className="rounded-[1.75rem] border-2 border-[#E9802D]/35 bg-[#FFFDF8] p-5 shadow-[0_18px_48px_rgba(23,36,61,0.07)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[#243A60]/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B84F0E]">
            Counselor Operations
          </p>
          <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-[#17243D]">
            Counselor Queue
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
            Automatically surfaces missing documents, overdue work, application
            gaps, communication needs, visa triggers, and AI risk signals.
          </p>
        </div>

        <span className="rounded-full border border-[#E9802D]/35 bg-[#FFF1E3] px-4 py-2 text-xs font-black text-[#B84F0E]">
          {queue.length} item{queue.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QueueMetric label="Critical" value={counts.critical} tone="critical" />
        <QueueMetric label="High" value={counts.high} tone="high" />
        <QueueMetric label="Medium" value={counts.medium} tone="medium" />
        <QueueMetric label="Stable" value={counts.stable} tone="stable" />
      </div>

      <div className="mt-5 space-y-3">
        {queue.map((item, index) => (
          <article
            key={`${item.title}-${index}`}
            className={`rounded-[1.35rem] border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.04)] ${getQueueStyle(
              item.level
            )}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-[#17243D]">{item.title}</p>
                  <span className="rounded-full border border-[#243A60]/16 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-[#667085]">
                    {item.category}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#667085]">
                  {item.description}
                </p>
              </div>

              <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getLevelBadge(item.level)}`}>
                {item.level}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function QueueMetric({ label, value, tone }) {
  return (
    <div className={`rounded-2xl border p-4 ${getQueueStyle(tone)}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#667085]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#17243D]">{value}</p>
    </div>
  );
}

function getQueueStyle(level = "") {
  if (level === "critical") return "border-[#C2413B]/30 bg-[#FFF0EE]";
  if (level === "high") return "border-[#A36A18]/30 bg-[#FFF7E8]";
  if (level === "medium") return "border-[#243A60]/22 bg-[#F3F5F8]";
  return "border-[#E9802D]/30 bg-[#FFF1E3]";
}

function getLevelBadge(level = "") {
  if (level === "critical") return "border-[#C2413B]/30 bg-white text-[#A8342F]";
  if (level === "high") return "border-[#A36A18]/30 bg-white text-[#8A5611]";
  if (level === "medium") return "border-[#243A60]/22 bg-white text-[#243A60]";
  return "border-[#E9802D]/30 bg-white text-[#B84F0E]";
}

export default CounselorQueuePanel;