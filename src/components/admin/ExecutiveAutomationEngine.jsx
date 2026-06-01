import { useMemo } from "react";
import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";

function ExecutiveAutomationEngine({ scores = [] }) {
  const automationTemplates = useMemo(() => {
    return (scores || [])
      .flatMap((score) => {
        const recommendations = buildExecutiveRecommendations(score);

        return recommendations
          .filter((recommendation) => recommendation.action !== "none")
          .map((recommendation) => ({
            score,
            recommendation,
            template: buildAutomationTemplate(score, recommendation),
          }));
      })
      .sort((a, b) => {
        const priorityA = getPriorityRank(a.recommendation.priority);
        const priorityB = getPriorityRank(b.recommendation.priority);
        return priorityB - priorityA;
      })
      .slice(0, 12);
  }, [scores]);

  return (
    <div className="rounded-[2rem] border border-purple-400/20 bg-purple-500/[0.04] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">
            Executive Automation Engine
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            CRM Action Templates
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Executive AI converts risk and opportunity signals into prepared CRM
            actions. Human approval still required before execution.
          </p>
        </div>

        <span className="rounded-full border border-purple-400/25 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300">
          {automationTemplates.length} Templates
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {automationTemplates.length ? (
          automationTemplates.map((item, index) => (
            <AutomationTemplateCard
              key={`${item.score.student_id}-${item.recommendation.type}-${index}`}
              item={item}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/40">
            No automation templates generated yet.
          </div>
        )}
      </div>
    </div>
  );
}

function AutomationTemplateCard({ item }) {
  const { score, recommendation, template } = item;
  const priorityStyle = getPriorityStyle(recommendation.priority);

  return (
    <div className={`rounded-2xl border p-4 ${priorityStyle}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{template.title}</p>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              {recommendation.priority}
            </span>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              {template.actionType}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {template.description}
          </p>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
              Prepared Payload
            </p>

            <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-white/55">
              {JSON.stringify(template.payload, null, 2)}
            </pre>
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 p-4 xl:w-56">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
            Student
          </p>

          <p className="mt-2 truncate font-bold text-white">
            {score.student_name || "Unknown Student"}
          </p>

          <div className="mt-3 grid gap-2 text-xs text-white/45">
            <p>Risk: {score.risk_score || 0}</p>
            <p>Opportunity: {score.opportunity_score || 0}</p>
            <p>Priority: {score.priority_level || "Standard"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildAutomationTemplate(score = {}, recommendation = {}) {
  const studentName = score.student_name || "Student";
  const studentId = score.student_id || "";
  const studentType = score.student_type || "inquiry";

  if (recommendation.action === "create_task") {
    return {
      actionType: "create_task",
      title: `Urgent Task: Review ${studentName}`,
      description:
        "Prepared task for counselor review based on executive risk scoring.",
      payload: {
        student_id: studentId,
        student_type: studentType,
        title: `Executive Risk Review: ${studentName}`,
        description:
          score.summary ||
          "Executive AI identified this student as requiring counselor review.",
        priority: recommendation.priority || "high",
        status: "pending",
      },
    };
  }

  if (recommendation.action === "create_reminder") {
    return {
      actionType: "create_reminder",
      title: `Follow-Up Reminder: ${studentName}`,
      description:
        "Prepared follow-up reminder based on executive risk or opportunity score.",
      payload: {
        student_id: studentId,
        student_type: studentType,
        title: `Executive Follow-Up: ${studentName}`,
        notes:
          score.summary ||
          "Executive AI recommends counselor follow-up for this student.",
        due_date: getTomorrowDate(),
        status: "pending",
      },
    };
  }

  if (recommendation.action === "send_email") {
    return {
      actionType: "send_email",
      title: `Email Follow-Up: ${studentName}`,
      description:
        "Prepared email communication template for high-opportunity student.",
      payload: {
        student_id: studentId,
        student_type: studentType,
        channel: "email",
        subject: "Zaifan Consultancy Follow-Up",
        message: `Hi ${studentName},\n\nI hope you are doing well. I wanted to follow up regarding your study abroad process and the next steps we can help you with.\n\nBest regards,\nZaifan Consultancy Team`,
        status: "draft",
      },
    };
  }

  if (recommendation.action === "send_whatsapp") {
    return {
      actionType: "send_whatsapp",
      title: `WhatsApp Follow-Up: ${studentName}`,
      description:
        "Prepared WhatsApp message template for quick student engagement.",
      payload: {
        student_id: studentId,
        student_type: studentType,
        channel: "whatsapp",
        message: `Hi ${studentName}, this is Zaifan Consultancy. Just following up on your study abroad process. Let me know when you are available for the next step.`,
        status: "draft",
      },
    };
  }

  if (recommendation.action === "schedule_call") {
    return {
      actionType: "schedule_call",
      title: `Conversion Call: ${studentName}`,
      description:
        "Prepared call task for high-opportunity executive priority student.",
      payload: {
        student_id: studentId,
        student_type: studentType,
        title: `Schedule Conversion Call: ${studentName}`,
        description:
          "High opportunity student. Schedule a counselor conversion call.",
        priority: "high",
        status: "pending",
      },
    };
  }

  return {
    actionType: "monitor",
    title: `Monitor ${studentName}`,
    description: "No direct automation action required.",
    payload: {
      student_id: studentId,
      student_type: studentType,
      status: "monitor",
    },
  };
}

function getTomorrowDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function getPriorityRank(priority = "") {
  const clean = String(priority).toLowerCase();

  if (clean === "critical") return 5;
  if (clean === "executive") return 4;
  if (clean === "high") return 3;
  if (clean === "medium") return 2;
  if (clean === "low") return 1;

  return 0;
}

function getPriorityStyle(priority = "") {
  const clean = String(priority).toLowerCase();

  if (clean === "critical") {
    return "border-red-400/25 bg-red-500/10";
  }

  if (clean === "executive") {
    return "border-[#D4AF37]/30 bg-[#D4AF37]/10";
  }

  if (clean === "high") {
    return "border-orange-400/25 bg-orange-500/10";
  }

  if (clean === "medium") {
    return "border-blue-400/25 bg-blue-500/10";
  }

  return "border-white/10 bg-white/[0.03]";
}

export default ExecutiveAutomationEngine;