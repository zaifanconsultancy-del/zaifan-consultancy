export function buildExecutiveActionTemplate(score = {}, recommendation = {}) {
  const studentName = score.student_name || "Student";
  const studentId = score.student_id || "";
  const studentType = score.student_type || "inquiry";

  if (recommendation.action === "create_task") {
    return {
      actionType: "create_task",
      title: `Executive Risk Review: ${studentName}`,
      description:
        "Create a counselor task for this student's executive risk case.",
      payload: {
        student_id: studentId,
        student_type: studentType,
        title: `Executive Risk Review: ${studentName}`,
        description:
          score.summary ||
          "Executive AI identified this student as needing counselor review.",
        priority: recommendation.priority || "high",
        status: "pending",
      },
    };
  }

  if (recommendation.action === "create_reminder") {
    return {
      actionType: "create_reminder",
      title: `Executive Follow-Up: ${studentName}`,
      description:
        "Create a follow-up reminder for this student.",
      payload: {
        student_id: studentId,
        student_type: studentType,
        title: `Executive Follow-Up: ${studentName}`,
        notes:
          score.summary ||
          "Executive AI recommends follow-up for this student.",
        due_date: getTomorrowDate(),
        status: "pending",
      },
    };
  }

  if (recommendation.action === "send_email") {
    return {
      actionType: "send_email",
      title: `Email Draft: ${studentName}`,
      description:
        "Prepare an email draft for this student.",
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
      title: `WhatsApp Draft: ${studentName}`,
      description:
        "Prepare a WhatsApp draft for this student.",
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
        "Create a call task for a high-opportunity student.",
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
    description: "No direct CRM action required.",
    payload: {
      student_id: studentId,
      student_type: studentType,
      status: "monitor",
    },
  };
}

export function buildExecutiveActionTemplates(scores = [], recommendationsByScore = {}) {
  return (scores || []).flatMap((score) => {
    const key = `${score.student_id}-${score.student_type}`;
    const recommendations = recommendationsByScore[key] || [];

    return recommendations.map((recommendation) => ({
      score,
      recommendation,
      template: buildExecutiveActionTemplate(score, recommendation),
    }));
  });
}

function getTomorrowDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}