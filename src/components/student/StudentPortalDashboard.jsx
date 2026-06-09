import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  buildPortalSummary,
  getStudentDisplayName,
  uploadStudentReceipt,
} from "../../lib/studentPortal";

function normalize(value = "") {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_");
}

function formatStatus(value = "") {
  const clean = String(value || "not_started").replace(/_/g, " ");
  return clean.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not set";

  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

function getStatusStyle(value = "") {
  const clean = normalize(value);

  if (["approved", "visa_approved", "completed", "complete", "done", "issued"].includes(clean)) {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  }

  if (["rejected", "refused", "cancelled", "failed", "missing"].includes(clean)) {
    return "border-red-400/25 bg-red-500/10 text-red-300";
  }

  if (["pending", "under_review", "submitted", "processing", "in_progress"].includes(clean)) {
    return "border-blue-400/25 bg-blue-500/10 text-blue-300";
  }

  if (["offer_received", "cas_issued", "accepted"].includes(clean)) {
    return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
  }

  return "border-white/10 bg-white/[0.04] text-white/55";
}

function getNotificationTarget(source = "") {
  const clean = normalize(source);

  if (clean.includes("task")) return "tasks";
  if (clean.includes("document")) return "documents";
  if (clean.includes("application")) return "applications";
  if (clean.includes("visa")) return "visa";
  if (clean.includes("message")) return "messages";
  if (clean.includes("communication")) return "messages";
  if (clean.includes("timeline")) return "timeline";
  if (clean.includes("support")) return "support";
  if (clean.includes("counselor")) return "support";
  if (clean.includes("universit")) return "universities";

  return "overview";
}

function notificationMatchesFilter(item, filter) {
  const source = normalize(item?.source);
  const type = normalize(item?.type);

  if (filter === "all") return true;
  if (filter === "urgent") return type === "urgent";
  if (filter === "alerts") return type === "warning";
  if (filter === "messages") return source.includes("message") || source.includes("communication");
  if (filter === "documents") return source.includes("document");
  if (filter === "tasks") return source.includes("task");
  if (filter === "applications") return source.includes("application");
  if (filter === "visa") return source.includes("visa");
  if (filter === "support") return source.includes("support") || source.includes("counselor");

  return true;
}


function clampPercent(value = 0) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function asPortalArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueMergeRows(...groups) {
  return Array.from(
    new Map(
      groups
        .flatMap((group) => asPortalArray(group))
        .filter(Boolean)
        .map((row) => [row.id || row.uuid || `${row.student_id || "student"}-${row.created_at || Math.random()}`, row])
    ).values()
  ).sort((a, b) => new Date(b.created_at || b.paid_at || b.submitted_at || 0).getTime() - new Date(a.created_at || a.paid_at || a.submitted_at || 0).getTime());
}

function getPortalStudentId(student = {}) {
  return String(student?.id || student?.student_id || "").trim();
}

function getPortalStudentType(student = {}, fallback = "inquiry") {
  return student?.student_type || student?.__leadType || student?.type || fallback || "inquiry";
}

function numericCount(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0) return number;
  }
  return 0;
}

function countFromPortalData(portalData = {}, key) {
  const rows = asPortalArray(portalData?.[key]);
  const counts = portalData?.counts || {};

  return Math.max(
    rows.length,
    numericCount(
      counts?.[key],
      counts?.[`${key}Count`],
      counts?.[`${key}_count`]
    )
  );
}

function buildDashboardCounts(portalData = {}, summary = {}) {
  const applicationsCount = countFromPortalData(portalData, "applications");
  const documentsCount = countFromPortalData(portalData, "documents");
  const tasksCount = countFromPortalData(portalData, "tasks");
  const universitiesCount = countFromPortalData(portalData, "universities");
  const communicationsCount = countFromPortalData(portalData, "communications");
  const timelineCount = countFromPortalData(portalData, "timeline");
  const supportRequestsCount = Math.max(
    countFromPortalData(portalData, "supportRequests"),
    countFromPortalData(portalData, "studentSupportRequests"),
    countFromPortalData(portalData, "support_requests")
  );

  const pendingTasksCount = Math.max(
    asPortalArray(portalData?.tasks).filter((task) => {
      const status = normalize(task?.status);
      return !["done", "completed", "complete", "closed", "approved"].includes(status);
    }).length,
    numericCount(
      portalData?.counts?.pendingTasks,
      portalData?.counts?.pending_tasks,
      portalData?.counts?.pendingTasksCount,
      summary?.pendingTasksCount
    )
  );

  return {
    applicationsCount,
    documentsCount,
    tasksCount,
    universitiesCount,
    communicationsCount,
    timelineCount,
    supportRequestsCount,
    pendingTasksCount,
    totalPortalRecords:
      applicationsCount +
      documentsCount +
      tasksCount +
      universitiesCount +
      communicationsCount +
      timelineCount +
      supportRequestsCount,
  };
}


function calculateAnalytics({
  summary = {},
  applications = [],
  documents = [],
  tasks = [],
  universities = [],
  communications = [],
  timeline = [],
  notifications = [],
}) {
  const completeStatuses = ["done", "completed", "complete", "closed", "approved", "issued"];
  const approvedDocuments = documents.filter((doc) => {
    const status = normalize(doc.status || doc.document_status);
    return status.includes("approved") || status.includes("complete");
  }).length;

  const completedTasks = tasks.filter((task) => completeStatuses.includes(normalize(task.status))).length;
  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const status = normalize(task.status);
    if (completeStatuses.includes(status)) return false;
    return new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
  }).length;

  const latestApplication = applications[0] || {};
  const applicationStatus = normalize(summary.applicationStatus || latestApplication.application_status || latestApplication.status);
  const offerStatus = normalize(summary.offerStatus || latestApplication.offer_status);
  const casStatus = normalize(summary.casStatus || latestApplication.cas_status || latestApplication.cas);
  const visaStatus = normalize(summary.visaStatus || latestApplication.visa_status);

  let journeyScore = 0;
  if (applications.length || !["not_started", "", "none"].includes(applicationStatus)) journeyScore += 20;
  if (["submitted", "under_review", "applied", "processing"].some((item) => applicationStatus.includes(item))) journeyScore += 15;
  if (["received", "accepted", "conditional", "unconditional"].some((item) => offerStatus.includes(item))) journeyScore += 20;
  if (["issued", "received"].some((item) => casStatus.includes(item))) journeyScore += 20;
  if (["approved", "granted"].some((item) => visaStatus.includes(item))) journeyScore += 25;

  const documentReadiness = documents.length ? (approvedDocuments / documents.length) * 100 : 0;
  const taskCompletion = tasks.length ? (completedTasks / tasks.length) * 100 : 0;
  const universityPlanning = universities.length ? Math.min(100, universities.length * 34) : 0;
  const communicationActivity = Math.min(100, communications.length * 25 + timeline.length * 2);
  const notificationPressure = notifications.filter((item) => ["urgent", "warning"].includes(item.type)).length;
  const pressurePenalty = Math.min(25, notificationPressure * 3 + overdueTasks * 4);

  const overallHealth = clampPercent(
    journeyScore * 0.32 +
      documentReadiness * 0.22 +
      taskCompletion * 0.22 +
      universityPlanning * 0.14 +
      communicationActivity * 0.10 -
      pressurePenalty
  );

  const recommendations = [];

  if (!applications.length) {
    recommendations.push({
      type: "warning",
      title: "Start Application Plan",
      message: "No application is visible yet. Start with university selection and first application setup.",
      targetTab: "applications",
      action: "Open Applications",
    });
  }

  if (documents.length && documentReadiness < 70) {
    recommendations.push({
      type: "warning",
      title: "Improve Document Readiness",
      message: "Some documents still need approval or review before the journey can move smoothly.",
      targetTab: "documents",
      action: "View Documents",
    });
  }

  if (overdueTasks > 0) {
    recommendations.push({
      type: "urgent",
      title: "Clear Overdue Tasks",
      message: `${overdueTasks} overdue task(s) need attention. Complete or ask your counselor for help.`,
      targetTab: "tasks",
      action: "Open Tasks",
    });
  }

  if (!universities.length) {
    recommendations.push({
      type: "warning",
      title: "Build University Shortlist",
      message: "No university plan is visible yet. Add dream, target, and safe options.",
      targetTab: "universities",
      action: "View Universities",
    });
  }

  if (!communications.length) {
    recommendations.push({
      type: "info",
      title: "No Messages Yet",
      message: "No student communication is visible yet. Messages will appear once your counselor sends updates.",
      targetTab: "messages",
      action: "View Messages",
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      type: "success",
      title: "Journey Looks Healthy",
      message: "Your visible Student OS data looks balanced. Keep documents, tasks, and messages updated.",
      targetTab: "overview",
      action: "Back to Overview",
    });
  }

  return {
    journeyScore: clampPercent(journeyScore),
    documentReadiness: clampPercent(documentReadiness),
    taskCompletion: clampPercent(taskCompletion),
    universityPlanning: clampPercent(universityPlanning),
    communicationActivity: clampPercent(communicationActivity),
    overallHealth,
    approvedDocuments,
    completedTasks,
    overdueTasks,
    notificationPressure,
    recommendations: recommendations.slice(0, 5),
  };
}


function calculateReadinessScores({
  summary = {},
  applications = [],
  documents = [],
  tasks = [],
  universities = [],
}) {
  const latestApplication = applications[0] || {};
  const applicationStatus = normalize(summary.applicationStatus || latestApplication.application_status || latestApplication.status);
  const offerStatus = normalize(summary.offerStatus || latestApplication.offer_status);
  const casStatus = normalize(summary.casStatus || latestApplication.cas_status || latestApplication.cas);
  const visaStatus = normalize(summary.visaStatus || latestApplication.visa_status);

  const approvedDocuments = documents.filter((doc) => {
    const status = normalize(doc.status || doc.document_status);
    return status.includes("approved") || status.includes("complete");
  }).length;

  const completedTasks = tasks.filter((task) => {
    const status = normalize(task.status);
    return ["done", "completed", "complete", "closed"].includes(status);
  }).length;

  const documentScore = documents.length ? (approvedDocuments / documents.length) * 100 : 0;
  const taskScore = tasks.length ? (completedTasks / tasks.length) * 100 : 0;
  const universityScore = universities.length ? Math.min(100, universities.length * 34) : 0;

  let applicationReadiness = 0;
  if (applications.length) applicationReadiness += 30;
  if (["applied", "submitted", "under_review", "processing"].some((item) => applicationStatus.includes(item))) applicationReadiness += 30;
  if (["received", "accepted", "conditional", "unconditional"].some((item) => offerStatus.includes(item))) applicationReadiness += 25;
  applicationReadiness += Math.min(15, universityScore * 0.15);

  let casReadiness = 0;
  if (["received", "accepted", "conditional", "unconditional"].some((item) => offerStatus.includes(item))) casReadiness += 35;
  casReadiness += documentScore * 0.35;
  casReadiness += taskScore * 0.15;
  if (["issued", "received"].some((item) => casStatus.includes(item))) casReadiness += 15;

  let visaReadiness = 0;
  if (["issued", "received"].some((item) => casStatus.includes(item))) visaReadiness += 35;
  visaReadiness += documentScore * 0.30;
  visaReadiness += taskScore * 0.20;
  if (["submitted", "processing", "approved", "granted"].some((item) => visaStatus.includes(item))) visaReadiness += 15;

  return {
    applicationReadiness: clampPercent(applicationReadiness),
    casReadiness: clampPercent(casReadiness),
    visaReadiness: clampPercent(visaReadiness),
    documentScore: clampPercent(documentScore),
    taskScore: clampPercent(taskScore),
    universityScore: clampPercent(universityScore),
  };
}

function buildJourneyRoadmap({ summary = {}, applications = [] }) {
  const latestApplication = applications[0] || {};
  const applicationStatus = normalize(summary.applicationStatus || latestApplication.application_status || latestApplication.status);
  const offerStatus = normalize(summary.offerStatus || latestApplication.offer_status);
  const casStatus = normalize(summary.casStatus || latestApplication.cas_status || latestApplication.cas);
  const visaStatus = normalize(summary.visaStatus || latestApplication.visa_status);

  const steps = [
    {
      id: "profile",
      title: "Profile Created",
      description: "Student record exists in Zaifan Student OS.",
      complete: Boolean(summary.studentId),
      targetTab: "profile",
    },
    {
      id: "university",
      title: "University Planning",
      description: "Dream, target, and safe university options are visible.",
      complete: applications.length > 0 || !["not_started", "", "none"].includes(applicationStatus),
      targetTab: "universities",
    },
    {
      id: "application",
      title: "Application Started",
      description: "Application record is connected to the student journey.",
      complete: applications.length > 0,
      targetTab: "applications",
    },
    {
      id: "submitted",
      title: "Application Submitted",
      description: "Application is submitted or under review.",
      complete: ["applied", "submitted", "under_review", "processing"].some((item) => applicationStatus.includes(item)),
      targetTab: "applications",
    },
    {
      id: "offer",
      title: "Offer Received",
      description: "Offer has been received or accepted.",
      complete: ["received", "accepted", "conditional", "unconditional"].some((item) => offerStatus.includes(item)),
      targetTab: "applications",
    },
    {
      id: "cas",
      title: "CAS Issued",
      description: "CAS is issued or ready for visa stage.",
      complete: ["issued", "received"].some((item) => casStatus.includes(item)),
      targetTab: "visa",
    },
    {
      id: "visa",
      title: "Visa Approved",
      description: "Visa is approved or granted.",
      complete: ["approved", "granted"].some((item) => visaStatus.includes(item)),
      targetTab: "visa",
    },
  ];

  const currentIndex = Math.max(0, steps.findIndex((step) => !step.complete));

  return steps.map((step, index) => ({
    ...step,
    index,
    active: index === currentIndex,
    complete: Boolean(step.complete),
  }));
}

function buildActionCenter({
  summary = {},
  applications = [],
  documents = [],
  tasks = [],
  universities = [],
  communications = [],
  analytics = {},
  readiness = {},
}) {
  const actions = [];
  const completeStatuses = ["done", "completed", "complete", "closed", "approved", "issued"];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  tasks.forEach((task) => {
    const status = normalize(task.status);
    const isComplete = completeStatuses.includes(status);
    const isOverdue = task.due_date && !isComplete && new Date(task.due_date).getTime() < todayStart.getTime();

    if (isOverdue) {
      actions.push({
        id: `overdue-task-${task.id}`,
        priority: "urgent",
        title: task.title || "Overdue Task",
        message: task.description || task.notes || "This task is overdue and needs attention.",
        date: task.due_date,
        source: "Tasks",
        targetTab: "tasks",
        action: "Open Tasks",
      });
      return;
    }

    if (!isComplete && ["pending", "todo", "to_do", "open", "in_progress", "not_started"].includes(status)) {
      actions.push({
        id: `pending-task-${task.id}`,
        priority: "important",
        title: task.title || "Pending Task",
        message: task.description || task.notes || "This task is still pending.",
        date: task.due_date || task.created_at,
        source: "Tasks",
        targetTab: "tasks",
        action: "Open Tasks",
      });
    }
  });

  documents.forEach((doc) => {
    const status = normalize(doc.status || doc.document_status);
    if (status.includes("rejected") || status.includes("missing")) {
      actions.push({
        id: `document-risk-${doc.id}`,
        priority: "urgent",
        title: doc.document_name || doc.file_name || doc.title || "Document Needs Attention",
        message: status.includes("rejected") ? "This document appears rejected and may need re-upload." : "This document appears missing.",
        date: doc.updated_at || doc.created_at,
        source: "Documents",
        targetTab: "documents",
        action: "View Documents",
      });
    } else if (status.includes("pending") || status.includes("under_review")) {
      actions.push({
        id: `document-review-${doc.id}`,
        priority: "important",
        title: doc.document_name || doc.file_name || doc.title || "Document Under Review",
        message: "This document is waiting for review or approval.",
        date: doc.updated_at || doc.created_at,
        source: "Documents",
        targetTab: "documents",
        action: "View Documents",
      });
    }
  });

  if (!applications.length) {
    actions.push({
      id: "no-application-action",
      priority: "important",
      title: "Start Application Plan",
      message: "No application is visible yet. Start with university selection and first application setup.",
      date: null,
      source: "Applications",
      targetTab: "applications",
      action: "Open Applications",
    });
  }

  if (!universities.length) {
    actions.push({
      id: "no-university-action",
      priority: "important",
      title: "Build University Shortlist",
      message: "No university plan is visible yet. Add dream, target, and safe options.",
      date: null,
      source: "Universities",
      targetTab: "universities",
      action: "View Universities",
    });
  }

  if (!documents.length) {
    actions.push({
      id: "no-documents-action",
      priority: "normal",
      title: "Upload Required Documents",
      message: "No uploaded documents are visible yet. Documents are required for application, CAS, and visa stages.",
      date: null,
      source: "Documents",
      targetTab: "documents",
      action: "View Documents",
    });
  }

  if (readiness.casReadiness < 50 && applications.length) {
    actions.push({
      id: "cas-readiness-action",
      priority: "important",
      title: "Improve CAS Readiness",
      message: `CAS readiness is ${readiness.casReadiness || 0}%. Focus on offer acceptance, documents, and pending tasks.`,
      date: null,
      source: "Visa",
      targetTab: "visa",
      action: "View Visa",
    });
  }

  if (readiness.visaReadiness < 50 && applications.length) {
    actions.push({
      id: "visa-readiness-action",
      priority: "normal",
      title: "Prepare Visa Stage",
      message: `Visa readiness is ${readiness.visaReadiness || 0}%. Keep documents and CAS progress updated.`,
      date: null,
      source: "Visa",
      targetTab: "visa",
      action: "View Visa",
    });
  }

  if (!communications.length) {
    actions.push({
      id: "no-messages-action",
      priority: "normal",
      title: "Watch for Counselor Updates",
      message: "No communication is visible yet. Messages will appear here once your counselor sends updates.",
      date: null,
      source: "Messages",
      targetTab: "messages",
      action: "View Messages",
    });
  }

  if (!actions.length) {
    actions.push({
      id: "healthy-action",
      priority: "success",
      title: "Everything Looks On Track",
      message: "No urgent action is visible right now. Keep checking tasks, documents, and messages.",
      date: null,
      source: "Overview",
      targetTab: "overview",
      action: "Back to Overview",
    });
  }

  const priorityWeight = { urgent: 4, important: 3, normal: 2, success: 1 };

  return actions
    .sort((a, b) => {
      const priorityDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    })
    .slice(0, 16);
}


function buildSuccessCenter({
  summary = {},
  analytics = {},
  readiness = {},
  actionCenterItems = [],
  applications = [],
  documents = [],
  tasks = [],
  universities = [],
}) {
  const applicationStatus = normalize(summary.applicationStatus);
  const offerStatus = normalize(summary.offerStatus);
  const casStatus = normalize(summary.casStatus);
  const visaStatus = normalize(summary.visaStatus);

  const activeAction = actionCenterItems?.[0];

  const statusGuides = [
    {
      id: "portal-guide",
      category: "Portal",
      title: "How to use your portal",
      message: "Use Overview for a quick snapshot, Action Center for what to do next, Roadmap for your journey stage, and Messages for counselor updates.",
      targetTab: "overview",
      action: "Open Overview",
    },
    {
      id: "documents-guide",
      category: "Documents",
      title: "Why documents matter",
      message: "Documents support applications, offers, CAS, and visa preparation. Keep uploaded documents clear, complete, and approved.",
      targetTab: "documents",
      action: "View Documents",
    },
    {
      id: "tasks-guide",
      category: "Tasks",
      title: "How tasks work",
      message: "Tasks are your visible checklist from Zaifan. Complete pending items early to avoid delays in application, CAS, and visa stages.",
      targetTab: "tasks",
      action: "Open Tasks",
    },
    {
      id: "applications-guide",
      category: "Applications",
      title: "What happens after application?",
      message: "After an application is submitted, it may move to under review, offer received, accepted, CAS preparation, and visa preparation.",
      targetTab: "applications",
      action: "View Applications",
    },
    {
      id: "cas-guide",
      category: "CAS",
      title: "What is CAS?",
      message: "CAS is the Confirmation of Acceptance for Studies. It is usually needed before moving into the student visa stage.",
      targetTab: "visa",
      action: "View Visa",
    },
    {
      id: "visa-guide",
      category: "Visa",
      title: "How to prepare for visa",
      message: "Visa readiness depends on CAS progress, approved documents, completed tasks, and updated application information.",
      targetTab: "visa",
      action: "View Visa",
    },
  ];

  const smartTips = [];

  if (analytics.overallHealth < 50) {
    smartTips.push({
      id: "health-low",
      type: "urgent",
      title: "Focus on your action center first",
      message: "Your portal health is low because important items need attention. Start with the highest priority action.",
      targetTab: "actions",
      action: "Open Action Center",
    });
  }

  if (readiness.applicationReadiness < 60) {
    smartTips.push({
      id: "application-readiness",
      type: "warning",
      title: "Improve application readiness",
      message: "Application readiness improves when your university plan, documents, and application records are complete.",
      targetTab: "applications",
      action: "Open Applications",
    });
  }

  if (readiness.casReadiness < 60 && (applications.length || offerStatus !== "not_started")) {
    smartTips.push({
      id: "cas-readiness",
      type: "warning",
      title: "Prepare for CAS",
      message: "CAS readiness improves when offer status, documents, and tasks are updated.",
      targetTab: "visa",
      action: "View Visa",
    });
  }

  if (readiness.visaReadiness < 60 && (casStatus !== "not_started" || visaStatus !== "not_started")) {
    smartTips.push({
      id: "visa-readiness",
      type: "info",
      title: "Prepare visa documents early",
      message: "Visa readiness depends on CAS, approved documents, and completed checklist tasks.",
      targetTab: "documents",
      action: "View Documents",
    });
  }

  if (!universities.length) {
    smartTips.push({
      id: "university-shortlist",
      type: "warning",
      title: "Build your university shortlist",
      message: "A strong plan usually includes dream, target, and safe university options.",
      targetTab: "universities",
      action: "View Universities",
    });
  }

  if (!documents.length) {
    smartTips.push({
      id: "documents-empty",
      type: "info",
      title: "Upload documents when requested",
      message: "Your document section is empty. Once Zaifan requests documents, upload them as soon as possible.",
      targetTab: "documents",
      action: "View Documents",
    });
  }

  if (!smartTips.length) {
    smartTips.push({
      id: "journey-good",
      type: "success",
      title: "You are on track",
      message: "Your visible portal data looks healthy. Keep checking tasks, documents, and messages for updates.",
      targetTab: "overview",
      action: "Back to Overview",
    });
  }

  const faqs = [
    {
      question: "When should I contact my counselor?",
      answer: "Contact your counselor if a task is overdue, a document is rejected, your offer/CAS/visa status looks wrong, or you do not understand the next step.",
    },
    {
      question: "Why do some sections show empty?",
      answer: "Empty sections usually mean that no visible record has been added yet, or that the team has not published that part of your journey to the portal.",
    },
    {
      question: "Does this show internal admin notes?",
      answer: "No. The student portal only shows portal-safe student journey data. Internal admin notes stay hidden.",
    },
    {
      question: "What should I check every day?",
      answer: "Check Action Center, Tasks, Documents, Messages, and Notifications. These sections show the most time-sensitive updates.",
    },
  ];

  return {
    activeAction,
    statusGuides,
    smartTips,
    faqs,
    stageLabel: formatStatus(
      visaStatus !== "not_started"
        ? visaStatus
        : casStatus !== "not_started"
          ? casStatus
          : offerStatus !== "not_started"
            ? offerStatus
            : applicationStatus || "not_started"
    ),
  };
}


function getDateValue(row = {}, keys = []) {
  for (const key of keys) {
    if (row?.[key]) return row[key];
  }
  return null;
}

function getDeadlineMeta(dateValue) {
  if (!dateValue) {
    return {
      date: null,
      daysLeft: null,
      label: "No date set",
      priority: "normal",
    };
  }

  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) {
    return {
      date: dateValue,
      daysLeft: null,
      label: "Date needs review",
      priority: "normal",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const daysLeft = Math.ceil((target.getTime() - today.getTime()) / 86400000);

  if (daysLeft < 0) {
    return {
      date: dateValue,
      daysLeft,
      label: `${Math.abs(daysLeft)} day(s) overdue`,
      priority: "urgent",
    };
  }

  if (daysLeft === 0) {
    return {
      date: dateValue,
      daysLeft,
      label: "Due today",
      priority: "urgent",
    };
  }

  if (daysLeft <= 3) {
    return {
      date: dateValue,
      daysLeft,
      label: `${daysLeft} day(s) left`,
      priority: "urgent",
    };
  }

  if (daysLeft <= 10) {
    return {
      date: dateValue,
      daysLeft,
      label: `${daysLeft} day(s) left`,
      priority: "important",
    };
  }

  return {
    date: dateValue,
    daysLeft,
    label: `${daysLeft} day(s) left`,
    priority: "normal",
  };
}

function buildDeadlineCenter({
  applications = [],
  documents = [],
  tasks = [],
  readiness = {},
}) {
  const items = [];
  const completeStatuses = ["done", "completed", "complete", "closed", "approved", "issued"];

  tasks.forEach((task) => {
    const status = normalize(task.status);
    if (completeStatuses.includes(status)) return;

    const meta = getDeadlineMeta(task.due_date);

    items.push({
      id: `task-deadline-${task.id || task.title}`,
      title: task.title || "Task Deadline",
      message: task.description || task.notes || "A task deadline is connected to your student journey.",
      source: "Tasks",
      targetTab: "tasks",
      action: "Open Tasks",
      ...meta,
    });
  });

  applications.forEach((app) => {
    const appTitle = app.university_name || app.university || app.course_name || "Application";
    const applicationDeadline = getDateValue(app, ["application_deadline", "deadline", "submission_deadline", "intake_deadline"]);
    const offerDeadline = getDateValue(app, ["offer_deadline", "acceptance_deadline", "deposit_deadline"]);
    const casDeadline = getDateValue(app, ["cas_deadline", "cas_due_date", "cas_target_date"]);
    const visaDeadline = getDateValue(app, ["visa_deadline", "visa_due_date", "visa_appointment_date", "visa_target_date"]);

    [
      ["Application Deadline", applicationDeadline, "applications", "Open Applications"],
      ["Offer / Deposit Deadline", offerDeadline, "applications", "Open Applications"],
      ["CAS Deadline", casDeadline, "visa", "View Visa"],
      ["Visa Deadline", visaDeadline, "visa", "View Visa"],
    ].forEach(([label, dateValue, targetTab, action]) => {
      if (!dateValue) return;
      const meta = getDeadlineMeta(dateValue);
      items.push({
        id: `${label}-${app.id || appTitle}`,
        title: `${label}: ${appTitle}`,
        message: `${label} is connected to this application record.`,
        source: targetTab === "visa" ? "Visa" : "Applications",
        targetTab,
        action,
        ...meta,
      });
    });
  });

  documents.forEach((doc) => {
    const status = normalize(doc.status || doc.document_status);
    const dateValue = getDateValue(doc, ["deadline", "due_date", "expiry_date", "expires_at"]);
    if (!dateValue && !status.includes("missing") && !status.includes("rejected")) return;

    const meta = getDeadlineMeta(dateValue);
    items.push({
      id: `document-deadline-${doc.id || doc.document_name}`,
      title: doc.document_name || doc.file_name || doc.title || "Document Deadline",
      message: status.includes("rejected")
        ? "This document may need re-upload before the next stage."
        : status.includes("missing")
          ? "This required document appears missing."
          : "This document has a date connected to it.",
      source: "Documents",
      targetTab: "documents",
      action: "View Documents",
      ...meta,
      priority: status.includes("rejected") || status.includes("missing") ? "urgent" : meta.priority,
    });
  });

  if (readiness.casReadiness < 50 && applications.length) {
    items.push({
      id: "cas-readiness-deadline",
      title: "CAS Readiness Window",
      message: `CAS readiness is ${readiness.casReadiness || 0}%. Keep documents, offer acceptance, and tasks moving before CAS becomes urgent.`,
      source: "Visa",
      targetTab: "visa",
      action: "View Visa",
      date: null,
      daysLeft: null,
      label: "Monitor closely",
      priority: "important",
    });
  }

  if (readiness.visaReadiness < 50 && applications.length) {
    items.push({
      id: "visa-readiness-deadline",
      title: "Visa Preparation Window",
      message: `Visa readiness is ${readiness.visaReadiness || 0}%. Prepare documents and CAS before visa timing becomes risky.`,
      source: "Visa",
      targetTab: "visa",
      action: "View Visa",
      date: null,
      daysLeft: null,
      label: "Prepare early",
      priority: "normal",
    });
  }

  if (!items.length) {
    items.push({
      id: "no-deadlines",
      title: "No Upcoming Deadline Found",
      message: "No task, application, document, CAS, or visa deadline is visible right now.",
      source: "Overview",
      targetTab: "overview",
      action: "Back to Overview",
      date: null,
      daysLeft: null,
      label: "Clear",
      priority: "success",
    });
  }

  const weight = { urgent: 4, important: 3, normal: 2, success: 1 };
  const sorted = items.sort((a, b) => {
    const priorityDiff = (weight[b.priority] || 0) - (weight[a.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.date || "2999-12-31").getTime() - new Date(b.date || "2999-12-31").getTime();
  });

  return {
    items: sorted.slice(0, 20),
    urgentCount: sorted.filter((item) => item.priority === "urgent").length,
    importantCount: sorted.filter((item) => item.priority === "important").length,
    overdueCount: sorted.filter((item) => Number(item.daysLeft) < 0).length,
  };
}

function buildCounselorCenter({ student = {}, account = null }) {
  const counselorName =
    student.counselor_name ||
    student.assigned_counselor ||
    student.assigned_to_name ||
    student.assigned_admin_name ||
    student.owner_name ||
    "Zaifan Counselor";

  const counselorEmail =
    student.counselor_email ||
    student.assigned_counselor_email ||
    student.assigned_to_email ||
    student.owner_email ||
    "Contact from Messages tab";

  const counselorPhone =
    student.counselor_phone ||
    student.assigned_counselor_phone ||
    student.assigned_to_phone ||
    student.owner_phone ||
    "Ask Zaifan team";

  const officeHours = student.office_hours || student.counselor_hours || "Working hours / by appointment";

  return {
    counselorName,
    counselorEmail,
    counselorPhone,
    officeHours,
    portalEmail: account?.email || student.email || student.student_email || "Legacy session",
    guidance: [
      {
        title: "When to contact your counselor",
        message: "Contact your counselor when a document is rejected, a deadline is close, an offer needs acceptance, or visa/CAS status is unclear.",
      },
      {
        title: "What to include in your message",
        message: "Mention your full name, student ID, university/course, and the exact task/document/application you need help with.",
      },
      {
        title: "Where replies appear",
        message: "Counselor updates and communication history will appear inside the Messages and Timeline tabs when connected.",
      },
    ],
  };
}


const SUPPORT_REQUEST_TYPES = [
  {
    id: "callback_request",
    icon: "📞",
    title: "Request Callback",
    subject: "Callback Request",
    description: "Ask Zaifan team to call you back about your student journey.",
    priority: "normal",
  },
  {
    id: "document_review",
    icon: "📄",
    title: "Document Review",
    subject: "Document Review Request",
    description: "Ask your counselor to check uploaded or pending documents.",
    priority: "important",
  },
  {
    id: "application_review",
    icon: "🎓",
    title: "Application Review",
    subject: "Application Review Request",
    description: "Ask for help with application status, offers, or next steps.",
    priority: "important",
  },
  {
    id: "visa_help",
    icon: "🌍",
    title: "Visa Help",
    subject: "Visa Help Request",
    description: "Ask for help with CAS, visa documents, or visa status questions.",
    priority: "high",
  },
  {
    id: "general_question",
    icon: "❓",
    title: "Ask Counselor",
    subject: "Question for Counselor",
    description: "Send a general question to your counselor.",
    priority: "normal",
  },
];

function getSupportRequestTypeMeta(type = "") {
  const clean = normalize(type);
  return (
    SUPPORT_REQUEST_TYPES.find((item) => normalize(item.id) === clean) ||
    SUPPORT_REQUEST_TYPES.find((item) => clean.includes(normalize(item.id))) ||
    SUPPORT_REQUEST_TYPES[SUPPORT_REQUEST_TYPES.length - 1]
  );
}

function buildSupportAnalytics(supportRequests = []) {
  const rows = asPortalArray(supportRequests);
  const closedStatuses = ["resolved", "closed", "completed"];
  const open = rows.filter((request) => normalize(request.status || "open") === "open").length;
  const inProgress = rows.filter((request) => normalize(request.status) === "in_progress").length;
  const resolved = rows.filter((request) =>
    closedStatuses.includes(normalize(request.status))
  ).length;
  const waitingForCounselor = rows.filter(
    (request) =>
      !request.counselor_response &&
      !closedStatuses.includes(normalize(request.status))
  ).length;
  const responsesReceived = rows.filter((request) => Boolean(request.counselor_response)).length;
  const highPriority = rows.filter((request) =>
    ["high", "urgent", "important"].includes(normalize(request.priority))
  ).length;

  const latest = rows[0] || null;
  const latestResponse = rows.find((request) => Boolean(request.counselor_response)) || null;
  const urgentOpen = rows.filter((request) => {
    const status = normalize(request.status || "open");
    const priority = normalize(request.priority || "normal");
    return !closedStatuses.includes(status) &&
      ["high", "urgent", "important"].includes(priority);
  }).length;

  const timeline = rows
    .flatMap((request) => {
      const meta = getSupportRequestTypeMeta(request.request_type);
      const events = [
        {
          id: `${request.id}-created`,
          title: request.subject || meta.subject || "Support request submitted",
          message: request.message || meta.description,
          date: request.created_at,
          type: "created",
          status: request.status || "open",
          priority: request.priority || meta.priority || "normal",
        },
      ];

      if (request.counselor_response) {
        events.push({
          id: `${request.id}-response`,
          title: "Counselor responded",
          message: request.counselor_response,
          date: request.responded_at || request.updated_at || request.created_at,
          type: "response",
          status: request.status || "resolved",
          priority: request.priority || meta.priority || "normal",
        });
      }

      if (request.resolved_at) {
        events.push({
          id: `${request.id}-resolved`,
          title: "Request resolved",
          message: request.subject || meta.subject || "Support request was resolved.",
          date: request.resolved_at,
          type: "resolved",
          status: request.status || "resolved",
          priority: request.priority || meta.priority || "normal",
        });
      }

      return events;
    })
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 8);

  return {
    total: rows.length,
    open,
    inProgress,
    resolved,
    waitingForCounselor,
    responsesReceived,
    highPriority,
    urgentOpen,
    latest,
    latestResponse,
    timeline,
  };
}


function buildStudentNotifications({
  summary = {},
  applications = [],
  documents = [],
  tasks = [],
  universities = [],
  communications = [],
  timeline = [],
  supportRequests = [],
}) {
  const notifications = [];

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const incompleteStatuses = ["pending", "todo", "to_do", "open", "in_progress", "not_started"];
  const completeStatuses = ["done", "completed", "complete", "closed", "approved", "issued"];

  tasks.forEach((task) => {
    const status = normalize(task.status);
    const dueTime = task.due_date ? new Date(task.due_date).getTime() : null;
    const isComplete = completeStatuses.includes(status);
    const isOverdue = dueTime && !isComplete && dueTime < todayStart.getTime();

    if (isOverdue) {
      notifications.push({
        id: `task-overdue-${task.id}`,
        type: "urgent",
        title: "Task Overdue",
        message: task.title || task.description || "A task needs your attention.",
        date: task.due_date,
        source: "Tasks",
        action: "Open Tasks",
        targetTab: "tasks",
      });
      return;
    }

    if (!isComplete && incompleteStatuses.includes(status)) {
      notifications.push({
        id: `task-pending-${task.id}`,
        type: "warning",
        title: "Pending Task",
        message: task.title || task.description || "You have a pending task.",
        date: task.due_date || task.created_at,
        source: "Tasks",
        action: "Open Tasks",
        targetTab: "tasks",
      });
    }
  });

  documents.forEach((doc) => {
    const status = normalize(doc.status || doc.document_status);

    if (status.includes("approved")) {
      notifications.push({
        id: `doc-approved-${doc.id}`,
        type: "success",
        title: "Document Approved",
        message: doc.document_name || doc.file_name || doc.title || "A document has been approved.",
        date: doc.updated_at || doc.created_at,
        source: "Documents",
        action: "View Documents",
        targetTab: "documents",
      });
      return;
    }

    if (["pending", "under_review", "missing", "rejected"].some((item) => status.includes(item))) {
      notifications.push({
        id: `doc-status-${doc.id}`,
        type: status.includes("rejected") || status.includes("missing") ? "urgent" : "info",
        title: `Document ${formatStatus(status)}`,
        message: doc.document_name || doc.file_name || doc.title || "A document needs review.",
        date: doc.updated_at || doc.created_at,
        source: "Documents",
        action: "View Documents",
        targetTab: "documents",
      });
    }
  });

  applications.forEach((app) => {
    const applicationStatus = normalize(app.application_status || app.status);
    const offerStatus = normalize(app.offer_status);
    const casStatus = normalize(app.cas_status || app.cas);
    const visaStatus = normalize(app.visa_status);

    if (offerStatus.includes("received") || offerStatus.includes("accepted")) {
      notifications.push({
        id: `offer-${app.id}`,
        type: "success",
        title: "Offer Update",
        message: `${app.university_name || app.university || "University"} offer status is ${formatStatus(offerStatus)}.`,
        date: app.updated_at || app.created_at,
        source: "Applications",
        action: "View Applications",
        targetTab: "applications",
      });
    }

    if (casStatus.includes("issued")) {
      notifications.push({
        id: `cas-${app.id}`,
        type: "success",
        title: "CAS Issued",
        message: `${app.university_name || app.university || "University"} CAS has been issued.`,
        date: app.updated_at || app.created_at,
        source: "Visa",
        action: "View Visa",
        targetTab: "visa",
      });
    }

    if (visaStatus.includes("approved")) {
      notifications.push({
        id: `visa-approved-${app.id}`,
        type: "success",
        title: "Visa Approved",
        message: "Your visa status is approved.",
        date: app.updated_at || app.created_at,
        source: "Visa",
        action: "View Visa",
        targetTab: "visa",
      });
    }

    if (visaStatus.includes("rejected") || visaStatus.includes("refused")) {
      notifications.push({
        id: `visa-risk-${app.id}`,
        type: "urgent",
        title: "Visa Attention Required",
        message: "Your visa status needs urgent review.",
        date: app.updated_at || app.created_at,
        source: "Visa",
        action: "View Visa",
        targetTab: "visa",
      });
    }

    if (applicationStatus.includes("submitted") || applicationStatus.includes("under_review")) {
      notifications.push({
        id: `application-${app.id}`,
        type: "info",
        title: "Application Progress",
        message: `${app.university_name || app.university || "Application"} is ${formatStatus(applicationStatus)}.`,
        date: app.updated_at || app.created_at,
        source: "Applications",
        action: "View Applications",
        targetTab: "applications",
      });
    }
  });

  communications.slice(0, 5).forEach((message) => {
    notifications.push({
      id: `message-${message.id}`,
      type: "info",
      title: message.subject || "Message Update",
      message: message.message || message.body || message.notes || "You have a communication update.",
      date: message.created_at,
      source: "Messages",
      action: "View Messages",
      targetTab: "messages",
    });
  });

  if (!universities.length) {
    notifications.push({
      id: "universities-empty",
      type: "warning",
      title: "University Plan Missing",
      message: "No university options are currently visible in your portal.",
      date: null,
      source: "Universities",
      action: "View Universities",
      targetTab: "universities",
    });
  }

  if (!applications.length) {
    notifications.push({
      id: "applications-empty",
      type: "warning",
      title: "No Application Yet",
      message: "No application record is currently visible in your portal.",
      date: null,
      source: "Applications",
      action: "View Applications",
      targetTab: "applications",
    });
  }

  if (!documents.length) {
    notifications.push({
      id: "documents-empty",
      type: "info",
      title: "No Documents Uploaded",
      message: "No uploaded documents are visible yet.",
      date: null,
      source: "Documents",
      action: "View Documents",
      targetTab: "documents",
    });
  }

  if (summary.pendingTasksCount > 0 && !notifications.some((item) => item.source === "Tasks")) {
    notifications.push({
      id: "tasks-summary",
      type: "warning",
      title: "Pending Tasks",
      message: `You have ${summary.pendingTasksCount} pending task(s).`,
      date: null,
      source: "Tasks",
      action: "Open Tasks",
      targetTab: "tasks",
    });
  }

  timeline.slice(0, 3).forEach((event) => {
    notifications.push({
      id: `timeline-${event.id}`,
      type: "neutral",
      title: event.title || formatStatus(event.action_type) || "Timeline Update",
      message: event.description || event.new_value || event.old_value || "Your student journey was updated.",
      date: event.created_at,
      source: "Timeline",
      action: "View Timeline",
      targetTab: "timeline",
    });
  });

  supportRequests.slice(0, 5).forEach((request) => {
    const status = normalize(request.status || "open");
    const priority = normalize(request.priority || "normal");
    const meta = getSupportRequestTypeMeta(request.request_type);

    if (request.counselor_response) {
      notifications.push({
        id: `support-response-${request.id}`,
        type: "success",
        title: "Counselor Responded",
        message: request.subject || meta.subject || "Your counselor replied to a support request.",
        date: request.responded_at || request.updated_at || request.created_at,
        source: "Support",
        action: "Open Support",
        targetTab: "support",
      });
      return;
    }

    if (!["resolved", "closed", "completed"].includes(status)) {
      notifications.push({
        id: `support-open-${request.id}`,
        type: ["high", "urgent", "important"].includes(priority) ? "warning" : "info",
        title: "Support Request Open",
        message: request.subject || meta.subject || "Your support request is waiting for review.",
        date: request.created_at,
        source: "Support",
        action: "Open Support",
        targetTab: "support",
      });
    }
  });

  return notifications
    .filter(Boolean)
    .map((item) => ({
      ...item,
      targetTab: item.targetTab || getNotificationTarget(item.source),
    }))
    .sort((a, b) => {
      const priority = { urgent: 4, warning: 3, success: 2, info: 1, neutral: 0 };
      const priorityDiff = (priority[b.type] || 0) - (priority[a.type] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();

      return bDate - aDate;
    })
    .slice(0, 20);
}

function StudentPortalDashboard({
  account = null,
  student,
  portalData = {},
  loadingData = false,
  error = "",
  sessionMode = "legacy",
  onRefresh = () => {},
  onLogout = () => {},
  onPasswordChange = null,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState({
    type: "",
    message: "",
    loading: false,
  });
  const [receiptForm, setReceiptForm] = useState({
    invoiceId: "",
    amount: "",
    currency: "PKR",
    reference: "",
    notes: "",
    file: null,
  });
  const [receiptUploadStatus, setReceiptUploadStatus] = useState({
    type: "",
    message: "",
    loading: false,
  });
  const [supportForm, setSupportForm] = useState({
    requestType: "callback_request",
    subject: "Callback Request",
    message: "",
    priority: "normal",
  });
  const [supportSubmitStatus, setSupportSubmitStatus] = useState({
    type: "",
    message: "",
    loading: false,
  });
  const [localSubmittedSupportRequests, setLocalSubmittedSupportRequests] = useState([]);
  const [localPaymentData, setLocalPaymentData] = useState({
    invoices: [],
    payments: [],
    receipts: [],
    paymentRequests: [],
    paymentAccounts: [],
    loading: false,
    error: "",
    loadedFor: "",
  });

  const rawSummary = useMemo(
    () => buildPortalSummary(student || {}, portalData || {}),
    [student, portalData]
  );

  const applications = asPortalArray(portalData?.applications);
  const documents = asPortalArray(portalData?.documents);
  const tasks = asPortalArray(portalData?.tasks);
  const universities = asPortalArray(portalData?.universities);
  const communications = asPortalArray(portalData?.communications);
  const timeline = asPortalArray(portalData?.timeline);
  const portalInvoices = asPortalArray(portalData?.invoices);
  const portalPayments = asPortalArray(portalData?.payments);
  const portalReceipts = asPortalArray(portalData?.receipts);
  const portalPaymentRequests = asPortalArray(
    portalData?.paymentRequests || portalData?.counselorPaymentRequests
  );
  const portalPaymentAccounts = asPortalArray(portalData?.paymentAccounts);

  const invoices = useMemo(
    () => uniqueMergeRows(localPaymentData.invoices, portalInvoices),
    [localPaymentData.invoices, portalInvoices]
  );

  const payments = useMemo(
    () => uniqueMergeRows(localPaymentData.payments, portalPayments),
    [localPaymentData.payments, portalPayments]
  );

  const receipts = useMemo(
    () => uniqueMergeRows(localPaymentData.receipts, portalReceipts),
    [localPaymentData.receipts, portalReceipts]
  );

  const paymentRequests = useMemo(
    () => uniqueMergeRows(localPaymentData.paymentRequests, portalPaymentRequests),
    [localPaymentData.paymentRequests, portalPaymentRequests]
  );

  const paymentAccounts = useMemo(
    () => uniqueMergeRows(localPaymentData.paymentAccounts, portalPaymentAccounts),
    [localPaymentData.paymentAccounts, portalPaymentAccounts]
  );

  useEffect(() => {
    const studentId = getPortalStudentId(student);
    const studentType = getPortalStudentType(student, rawSummary?.studentType || "inquiry");
    const loadKey = `${studentType}-${studentId}`;

    if (activeTab !== "payments" || !studentId || localPaymentData.loadedFor === loadKey) {
      return;
    }

    let cancelled = false;

    async function loadLivePaymentData() {
      setLocalPaymentData((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));

      const fetchRows = async (table, options = {}) => {
        const {
          orderBy = "created_at",
          ascending = false,
          limit = 50,
          matchStudentType = false,
        } = options;

        let query = supabase.from(table).select("*").eq("student_id", studentId);

        if (matchStudentType && studentType) {
          query = query.eq("student_type", studentType);
        }

        if (orderBy) query = query.order(orderBy, { ascending });
        if (limit) query = query.limit(limit);

        const strict = await query;

        if (!strict.error && Array.isArray(strict.data) && strict.data.length) {
          return strict.data;
        }

        if (matchStudentType) {
          let fallback = supabase.from(table).select("*").eq("student_id", studentId);
          if (orderBy) fallback = fallback.order(orderBy, { ascending });
          if (limit) fallback = fallback.limit(limit);
          const fallbackResult = await fallback;
          if (!fallbackResult.error) return fallbackResult.data || [];
        }

        if (strict.error) {
          console.warn(`Student portal payment live fetch skipped: ${table}`, strict.error.message || strict.error);
        }

        return [];
      };

      try {
        const [liveInvoices, livePayments, liveReceipts, livePaymentRequests, livePaymentAccounts] =
          await Promise.all([
            fetchRows("student_invoices", { matchStudentType: true, limit: 50 }),
            fetchRows("student_payments", { matchStudentType: true, limit: 50 }),
            fetchRows("student_receipts", { matchStudentType: true, limit: 50 }),
            fetchRows("counselor_payment_requests", { matchStudentType: true, limit: 50 }),
            supabase
              .from("payment_accounts")
              .select("*")
              .eq("is_active", true)
              .order("id", { ascending: false })
              .limit(10)
              .then((result) => {
                if (result.error) {
                  console.warn("Student portal payment accounts live fetch skipped:", result.error.message || result.error);
                  return [];
                }
                return result.data || [];
              }),
          ]);

        if (cancelled) return;

        setLocalPaymentData({
          invoices: liveInvoices || [],
          payments: livePayments || [],
          receipts: liveReceipts || [],
          paymentRequests: livePaymentRequests || [],
          paymentAccounts: livePaymentAccounts || [],
          loading: false,
          error: "",
          loadedFor: loadKey,
        });
      } catch (paymentError) {
        if (cancelled) return;

        setLocalPaymentData((prev) => ({
          ...prev,
          loading: false,
          error: paymentError?.message || "Payment data could not be loaded.",
          loadedFor: loadKey,
        }));
      }
    }

    loadLivePaymentData();

    return () => {
      cancelled = true;
    };
  }, [activeTab, student, rawSummary?.studentType, localPaymentData.loadedFor]);

  const supportRequests = useMemo(() => {
    const portalSupportRequests = asPortalArray(
      portalData?.supportRequests ||
        portalData?.studentSupportRequests ||
        portalData?.support_requests
    );

    const merged = [...localSubmittedSupportRequests, ...portalSupportRequests];

    return Array.from(
      new Map(
        merged
          .filter(Boolean)
          .map((request) => [request.id || `${request.request_type}-${request.created_at}`, request])
      ).values()
    ).sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );
  }, [portalData, localSubmittedSupportRequests]);

  const supportAnalytics = useMemo(
    () => buildSupportAnalytics(supportRequests),
    [supportRequests]
  );

  const dashboardCounts = useMemo(
    () => buildDashboardCounts(portalData || {}, rawSummary || {}),
    [portalData, rawSummary]
  );

  const summary = useMemo(
    () => ({
      ...(rawSummary || {}),
      ...dashboardCounts,
      latestApplication:
        rawSummary?.latestApplication ||
        applications?.[0] ||
        {},
    }),
    [rawSummary, dashboardCounts, applications]
  );

  const latestApplication = summary.latestApplication || {};

  const pendingTasks = summary.pendingTasks || [];
  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const status = normalize(task.status);
    if (["done", "completed", "complete", "closed"].includes(status)) return false;
    return new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
  });

  const documentReadiness =
    summary.documentsCount > 0
      ? Math.round(
          (documents.filter((doc) =>
            normalize(doc.status || doc.document_status).includes("approved")
          ).length /
            summary.documentsCount) *
            100
        )
      : 0;

  const notifications = useMemo(
    () =>
      buildStudentNotifications({
        summary,
        applications,
        documents,
        tasks,
        universities,
        communications,
        timeline,
        supportRequests,
      }),
    [summary, applications, documents, tasks, universities, communications, timeline, supportRequests]
  );

  const urgentNotifications = notifications.filter((item) => item.type === "urgent").length;
  const warningNotifications = notifications.filter((item) => item.type === "warning").length;

  const filteredNotifications = useMemo(
    () => notifications.filter((item) => notificationMatchesFilter(item, notificationFilter)),
    [notifications, notificationFilter]
  );

  const notificationFilters = [
    ["all", "All", notifications.length],
    ["urgent", "Urgent", urgentNotifications],
    ["alerts", "Alerts", warningNotifications],
    ["messages", "Messages", notifications.filter((item) => notificationMatchesFilter(item, "messages")).length],
    ["documents", "Documents", notifications.filter((item) => notificationMatchesFilter(item, "documents")).length],
    ["tasks", "Tasks", notifications.filter((item) => notificationMatchesFilter(item, "tasks")).length],
    ["applications", "Applications", notifications.filter((item) => notificationMatchesFilter(item, "applications")).length],
    ["visa", "Visa", notifications.filter((item) => notificationMatchesFilter(item, "visa")).length],
    ["support", "Support", notifications.filter((item) => normalize(item?.source).includes("support")).length],
  ];

  const analytics = useMemo(
    () =>
      calculateAnalytics({
        summary,
        applications,
        documents,
        tasks,
        universities,
        communications,
        timeline,
        notifications,
      }),
    [summary, applications, documents, tasks, universities, communications, timeline, notifications]
  );

  const readiness = useMemo(
    () =>
      calculateReadinessScores({
        summary,
        applications,
        documents,
        tasks,
        universities,
      }),
    [summary, applications, documents, tasks, universities]
  );

  const roadmap = useMemo(
    () => buildJourneyRoadmap({ summary, applications }),
    [summary, applications]
  );

  const actionCenterItems = useMemo(
    () =>
      buildActionCenter({
        summary,
        applications,
        documents,
        tasks,
        universities,
        communications,
        analytics,
        readiness,
      }),
    [summary, applications, documents, tasks, universities, communications, analytics, readiness]
  );


  const successCenter = useMemo(
    () =>
      buildSuccessCenter({
        summary,
        analytics,
        readiness,
        actionCenterItems,
        applications,
        documents,
        tasks,
        universities,
      }),
    [summary, analytics, readiness, actionCenterItems, applications, documents, tasks, universities]
  );

  const deadlineCenter = useMemo(
    () =>
      buildDeadlineCenter({
        applications,
        documents,
        tasks,
        readiness,
      }),
    [applications, documents, tasks, readiness]
  );

  const counselorCenter = useMemo(
    () => buildCounselorCenter({ student, account }),
    [student, account]
  );

  const urgentActions = actionCenterItems.filter((item) => item.priority === "urgent").length;
  const importantActions = actionCenterItems.filter((item) => item.priority === "important").length;

  const totalInvoiceAmount = invoices.reduce(
    (sum, row) => sum + Number(row.total_amount || row.amount || row.invoice_amount || 0),
    0
  );

  const paidAmount = payments.reduce(
    (sum, row) => sum + Number(row.amount || row.paid_amount || row.payment_amount || 0),
    0
  );

  const pendingAmount = Math.max(0, totalInvoiceAmount - paidAmount);
  const overdueInvoices = invoices.filter((invoice) => {
    if (!invoice.due_date) return false;
    const status = normalize(invoice.status);
    if (["paid", "cancelled", "void"].includes(status)) return false;
    return new Date(invoice.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
  });

  const formatMoney = (amount, currency = "PKR") => `${currency} ${Number(amount || 0).toLocaleString()}`;

  async function handleDashboardRefresh() {
    setLocalPaymentData((prev) => ({
      ...prev,
      loadedFor: "",
      error: "",
    }));

    await onRefresh();
  }

  function handleSupportTypeSelect(typeId) {
    const meta = getSupportRequestTypeMeta(typeId);

    setSupportForm((prev) => ({
      ...prev,
      requestType: meta.id,
      subject: prev.subject && prev.subject !== getSupportRequestTypeMeta(prev.requestType).subject
        ? prev.subject
        : meta.subject,
      priority: meta.priority || "normal",
    }));

    setActiveTab("support");
  }

  async function handleSupportRequestSubmit(event) {
    event.preventDefault();

    if (!student?.id) {
      setSupportSubmitStatus({
        type: "warning",
        message: "Student session is missing. Please refresh and try again.",
        loading: false,
      });
      return;
    }

    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      setSupportSubmitStatus({
        type: "warning",
        message: "Add a subject and message before submitting.",
        loading: false,
      });
      return;
    }

    setSupportSubmitStatus({
      type: "info",
      message: "Submitting your request...",
      loading: true,
    });

    try {
      const payload = {
        student_id: student.id,
        student_type:
          summary.studentType ||
          student.student_type ||
          student.__leadType ||
          student.type ||
          "inquiry",
        request_type: supportForm.requestType || "general_question",
        subject: supportForm.subject.trim(),
        message: supportForm.message.trim(),
        priority: supportForm.priority || "normal",
        status: "open",
      };

      const { data, error: supportError } = await supabase
        .from("student_support_requests")
        .insert(payload)
        .select("*")
        .single();

      if (supportError) throw supportError;

      const savedRequest = data || {
        ...payload,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      setLocalSubmittedSupportRequests((prev) => [savedRequest, ...prev]);
      setSupportForm({
        requestType: "callback_request",
        subject: "Callback Request",
        message: "",
        priority: "normal",
      });
      setSupportSubmitStatus({
        type: "success",
        message: "Support request submitted. Zaifan team can now see it in Admin Support Requests.",
        loading: false,
      });

      await handleDashboardRefresh();
    } catch (supportError) {
      setSupportSubmitStatus({
        type: "warning",
        message:
          supportError?.message ||
          "Support request could not be submitted. Please try again.",
        loading: false,
      });
    }
  }

  async function handleReceiptUploadSubmit(event) {
    event.preventDefault();

    setReceiptUploadStatus({ type: "", message: "", loading: true });

    try {
      if (!receiptForm.file) {
        throw new Error("Attach receipt image or PDF before submitting.");
      }

      const receiptResult = await uploadStudentReceipt({
        student,
        invoiceId: receiptForm.invoiceId,
        amount: receiptForm.amount,
        currency: receiptForm.currency || "PKR",
        reference: receiptForm.reference,
        notes: receiptForm.notes,
        file: receiptForm.file,
      });

      if (receiptResult?.receipt) {
        setLocalPaymentData((prev) => ({
          ...prev,
          receipts: uniqueMergeRows([receiptResult.receipt], prev.receipts),
          loadedFor: "",
          error: "",
        }));
      }

      setReceiptForm({
        invoiceId: "",
        amount: "",
        currency: "PKR",
        reference: "",
        notes: "",
        file: null,
      });

      setReceiptUploadStatus({
        type: "success",
        message: "Receipt submitted. Zaifan team will review it.",
        loading: false,
      });

      await handleDashboardRefresh();
    } catch (uploadError) {
      setReceiptUploadStatus({
        type: "warning",
        message:
          uploadError?.message ||
          "Receipt upload failed. Please try again or send the receipt to your counselor.",
        loading: false,
      });
    }
  }

  async function handlePasswordChangeSubmit(event) {
    event.preventDefault();

    if (sessionMode !== "account") {
      setPasswordStatus({
        type: "warning",
        message: "Password change is only available for account-login sessions. Legacy lookup students need account migration first.",
        loading: false,
      });
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordStatus({
        type: "warning",
        message: "Fill current password, new password, and confirmation.",
        loading: false,
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordStatus({
        type: "warning",
        message: "New password should be at least 8 characters.",
        loading: false,
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({
        type: "warning",
        message: "New password and confirmation do not match.",
        loading: false,
      });
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordStatus({
        type: "warning",
        message: "New password must be different from current password.",
        loading: false,
      });
      return;
    }

    if (typeof onPasswordChange !== "function") {
      setPasswordStatus({
        type: "info",
        message: "Password form is ready, but the backend password-change action is not connected yet. Next we wire this to studentPortal.js/RPC.",
        loading: false,
      });
      return;
    }

    try {
      setPasswordStatus({
        type: "info",
        message: "Updating password...",
        loading: true,
      });

      const result = await onPasswordChange({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        account,
        student,
      });

      if (result?.error) {
        throw result.error;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordStatus({
        type: "success",
        message: "Password updated successfully.",
        loading: false,
      });
    } catch (passwordError) {
      setPasswordStatus({
        type: "warning",
        message: passwordError?.message || "Password could not be updated.",
        loading: false,
      });
    }
  }

  function goToNotificationTarget(item) {
    setActiveTab(item?.targetTab || getNotificationTarget(item?.source));
    window.setTimeout(() => {
      document.querySelector("main")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }
const completedJourneySteps = roadmap.filter(
  (step) => step.complete
).length;

const journeyProgress = roadmap.length
  ? Math.round(
      (completedJourneySteps / roadmap.length) * 100
    )
  : 0;
  const executiveSignals = [
    {
      title: "Journey Stage",
      value: formatStatus(summary.applicationStatus),
      note: "Based on latest visible application status.",
    },
    {
      title: "Document Readiness",
      value: `${documentReadiness}%`,
      note: documents.length
        ? "Calculated from approved visible documents."
        : "No uploaded documents visible yet.",
    },
    {
      title: "Task Health",
      value: overdueTasks.length ? `${overdueTasks.length} Overdue` : "On Track",
      note: overdueTasks.length
        ? "Some tasks need attention from the student or counselor."
        : "No overdue task is currently visible.",
    },
    {
      title: "University Plan",
      value: `${summary.universitiesCount || 0} Options`,
      note: universities.length
        ? "University planning data is connected to the portal."
        : "No university plan is visible yet.",
    },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="absolute right-[-20%] top-[-15%] h-[420px] w-[420px] rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-20%] h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-5 backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-[#D4AF37]">
                  Zaifan Student Portal
                </p>

                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                  Live OS Data
                </span>

                <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37]">
                  {sessionMode === "account" ? "Account Login" : "Legacy Session"}
                </span>

                {urgentNotifications ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("notifications")}
                    className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-500/20"
                  >
                    {urgentNotifications} Urgent
                  </button>
                ) : null}

                {warningNotifications ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("notifications")}
                    className="rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-300 transition hover:bg-orange-500/20"
                  >
                    {warningNotifications} Alerts
                  </button>
                ) : null}
              </div>

              <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                Welcome, {getStudentDisplayName(student)}
              </h1>

              <p className="mt-2 text-sm text-white/50">
                Student Type: {formatStatus(summary.studentType)} · Student ID:{" "}
                {summary.studentId || "Not available"}
              </p>

              <p className="mt-1 text-xs text-white/35">
                Portal Account: {account?.email || "Legacy lookup account"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDashboardRefresh}
                disabled={loadingData}
                className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingData ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-white/10 bg-white/[0.035] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/55 transition hover:border-red-400/30 hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3 text-sm text-orange-200">
              {error}
            </div>
          ) : null}
        </header>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard title="Application" value={summary.applicationStatus} />
          <StatusCard title="Offer" value={summary.offerStatus} />
          <StatusCard title="CAS" value={summary.casStatus} />
          <StatusCard title="Visa" value={summary.visaStatus} />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-11">
  <MetricCard label="Applications" value={summary.applicationsCount} />
  <MetricCard label="Documents" value={summary.documentsCount} />
  <MetricCard label="Tasks" value={summary.tasksCount} />
  <MetricCard label="Pending Tasks" value={summary.pendingTasksCount} warning />
  <MetricCard label="Universities" value={summary.universitiesCount} />
  <MetricCard label="Messages" value={summary.communicationsCount} />
  <MetricCard label="Timeline" value={summary.timelineCount} />
  <MetricCard label="Health" value={`${analytics.overallHealth}%`} />
  <MetricCard
  label="Journey"
  value={`${journeyProgress}%`}
/>
  <MetricCard label="Alerts" value={urgentNotifications + warningNotifications} warning />
  <MetricCard label="Support" value={supportAnalytics.total} warning={supportAnalytics.urgentOpen > 0} />
</div>

        <div className="mt-5 rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.055] p-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">
                Portal Command Center
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">
                Continue your student journey from one place
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Journey Progress {journeyProgress}% ·
Health {analytics.overallHealth}% ·
{urgentActions} urgent action(s) ·
{deadlineCenter.urgentCount} urgent deadline(s) ·
{supportAnalytics.open} open support request(s) ·
Current stage: {successCenter.stageLabel}
              </p>

              {supportAnalytics.urgentOpen > 0 ? (
                <div className="mt-4 rounded-2xl border border-orange-400/25 bg-orange-500/10 p-3 text-sm text-orange-200">
                  {supportAnalytics.urgentOpen} high-priority support request(s) are open. Your counselor can see them in Admin Support Requests.
                </div>
              ) : supportAnalytics.latestResponse ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  Latest counselor response is available in Support Center.
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("actions")}
                  className="rounded-full bg-[#D4AF37] px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:opacity-90"
                >
                  Open Action Center
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("deadlines")}
                  className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/55 transition hover:text-white"
                >
                  Check Deadlines
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("success")}
                  className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/55 transition hover:text-white"
                >
                  Success Center
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("support")}
                  className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  Ask Counselor
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <QuickLaunchCard label="Next Action" value={actionCenterItems?.[0]?.title || "All clear"} onOpen={() => setActiveTab("actions")} />
              <QuickLaunchCard label="Application Ready" value={`${readiness.applicationReadiness}%`} onOpen={() => setActiveTab("roadmap")} />
              <QuickLaunchCard label="CAS Ready" value={`${readiness.casReadiness}%`} onOpen={() => setActiveTab("visa")} />
              <QuickLaunchCard label="Visa Ready" value={`${readiness.visaReadiness}%`} onOpen={() => setActiveTab("visa")} />
                <QuickLaunchCard
  label="Documents"
  value={`${readiness.documentScore}%`}
  onOpen={() => setActiveTab("documents")}
/>

<QuickLaunchCard
  label="Tasks"
  value={`${readiness.taskScore}%`}
  onOpen={() => setActiveTab("tasks")}
/>

<QuickLaunchCard
  label="Support"
  value={`${supportAnalytics.open} open`}
  onOpen={() => setActiveTab("support")}
/>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-2">
          {[
            ["overview", "Overview"],
            ["actions", `Action Center${urgentActions ? ` (${urgentActions})` : ""}`],
            ["deadlines", `Deadlines${deadlineCenter.urgentCount ? ` (${deadlineCenter.urgentCount})` : ""}`],
            ["roadmap", "Roadmap"],
            ["success", "Success Center"],
            ["counselor", "Counselor"],
            ["support", `Support Center${supportRequests.length ? ` (${supportRequests.length})` : ""}`],
            ["payments", `Payments${overdueInvoices.length ? ` (${overdueInvoices.length})` : ""}`],
            ["profile", "Profile"],
            ["applications", "Applications"],
            ["visa", "Visa"],
            ["documents", "Documents"],
            ["tasks", "Tasks"],
            ["universities", "Universities"],
            ["messages", "Messages"],
            ["timeline", "Timeline"],
            ["analytics", "Analytics"],
            ["insights", "Executive Insights"],
            ["notifications", `Notifications${notifications.length ? ` (${notifications.length})` : ""}`],
            ["settings", "Settings"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                activeTab === id
                  ? "bg-[#D4AF37] text-black"
                  : "text-white/45 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <main className="mt-6">
          {activeTab === "support" ? (
          <div className="space-y-5">
            <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-500/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                Student Support Center
              </p>
              <h3 className="mt-2 text-2xl font-black text-white">
                Ask your counselor and track every response
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Submit callback, document review, application review, visa help, or general counselor questions. Replies from Zaifan appear here automatically.
              </p>
            </div>

            {supportAnalytics.urgentOpen > 0 ? (
              <div className="rounded-2xl border border-orange-400/25 bg-orange-500/10 p-4 text-sm text-orange-200">
                {supportAnalytics.urgentOpen} high-priority request(s) are still open. Keep an eye on counselor responses.
              </div>
            ) : supportAnalytics.latestResponse ? (
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                Latest counselor response: {supportAnalytics.latestResponse.subject || "Support request response"}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="Total Requests" value={supportAnalytics.total} />
              <MetricCard label="Open" value={supportAnalytics.open} warning={supportAnalytics.open > 0} />
              <MetricCard label="In Progress" value={supportAnalytics.inProgress} />
              <MetricCard label="Responses" value={supportAnalytics.responsesReceived} />
              <MetricCard label="Resolved" value={supportAnalytics.resolved} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <form onSubmit={handleSupportRequestSubmit} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
                <p className="text-sm font-black text-white">Create Support Request</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {SUPPORT_REQUEST_TYPES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSupportTypeSelect(item.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        supportForm.requestType === item.id
                          ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200"
                          : "border-white/10 bg-black/20 text-white/55 hover:border-cyan-400/25 hover:text-white"
                      }`}
                    >
                      <p className="font-black text-white">{item.icon} {item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/45">{item.description}</p>
                    </button>
                  ))}
                </div>

                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-white/35">Subject</span>
                  <input
                    value={supportForm.subject}
                    onChange={(event) => setSupportForm((prev) => ({ ...prev, subject: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                  />
                </label>

                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-white/35">Message</span>
                  <textarea
                    value={supportForm.message}
                    onChange={(event) => setSupportForm((prev) => ({ ...prev, message: event.target.value }))}
                    rows={5}
                    placeholder="Write what you need help with. Include document, application, university, CAS, or visa details if relevant."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-cyan-400/40"
                  />
                </label>

                {supportSubmitStatus.message ? (
                  <div className={`mt-4 rounded-2xl border p-3 text-sm ${
                    supportSubmitStatus.type === "success"
                      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                      : "border-orange-400/25 bg-orange-500/10 text-orange-200"
                  }`}>
                    {supportSubmitStatus.message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={supportSubmitStatus.loading}
                  className="mt-4 rounded-full bg-[#D4AF37] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-black disabled:opacity-50"
                >
                  {supportSubmitStatus.loading ? "Submitting..." : "Submit Request"}
                </button>
              </form>

              <div className="space-y-4">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
                  <p className="text-sm font-black text-white">Support Timeline</p>
                  <div className="mt-4 space-y-3">
                    {supportAnalytics.timeline?.length ? (
                      supportAnalytics.timeline.map((event) => (
                        <SupportTimelineCard key={event.id} event={event} />
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">
                        No support activity yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
              <p className="text-sm font-black text-white">Request History</p>
              <div className="mt-4 space-y-3">
                {supportRequests.length ? (
                  supportRequests.map((request) => (
                    <SupportRequestHistoryCard key={request.id || `${request.request_type}-${request.created_at}`} request={request} />
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/40">
                    No support requests submitted yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
          {activeTab === "payments" ? (
  <Panel title="Payment Center">
    {localPaymentData.loading ? (
      <div className="mb-4 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-sm font-bold text-[#D4AF37]">
        Syncing latest payment records from Admin Payment Center...
      </div>
    ) : null}

    {localPaymentData.error ? (
      <div className="mb-4 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3 text-sm text-orange-200">
        {localPaymentData.error}
      </div>
    ) : null}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Invoices" value={invoices.length} />
      <MetricCard label="Paid" value={formatMoney(paidAmount)} />
      <MetricCard label="Outstanding" value={formatMoney(pendingAmount)} warning />
      <MetricCard label="Overdue" value={overdueInvoices.length} warning />
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
        <p className="text-sm font-black text-white">Invoices</p>

        <div className="mt-4 space-y-3">
          {invoices.length ? (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-white">
                      {invoice.title || invoice.invoice_title || `Invoice #${invoice.id}`}
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      Due: {formatDate(invoice.due_date)} · Created:{" "}
                      {formatDate(invoice.created_at)}
                    </p>

                    {invoice.description || invoice.notes ? (
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        {invoice.description || invoice.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-lg font-black text-[#D4AF37]">
                      {formatMoney(
                        invoice.total_amount || invoice.amount || invoice.invoice_amount,
                        invoice.currency || "PKR"
                      )}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getStatusStyle(
                        invoice.status || invoice.payment_status || invoice.invoice_status
                      )}`}
                    >
                      {formatStatus(
                        invoice.status || invoice.payment_status || invoice.invoice_status || "pending"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState text="No invoices are visible yet." />
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="text-sm font-black text-white">Payment Summary</p>

          <div className="mt-4 space-y-3">
            <InfoRow label="Total Invoice Amount" value={formatMoney(totalInvoiceAmount)} />
            <InfoRow label="Total Paid" value={formatMoney(paidAmount)} />
            <InfoRow label="Outstanding" value={formatMoney(pendingAmount)} />
            <InfoRow label="Overdue Invoices" value={overdueInvoices.length} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="text-sm font-black text-white">Recent Payments</p>

          <div className="mt-4 space-y-3">
            {payments.length ? (
              payments.slice(0, 6).map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">
                        {payment.payment_method || payment.method || "Payment"}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {formatDate(payment.payment_date || payment.created_at)}
                      </p>
                    </div>

                    <p className="text-sm font-black text-emerald-300">
                      {formatMoney(payment.amount || payment.paid_amount, payment.currency || "PKR")}
                    </p>
                  </div>

                  {payment.notes ? (
                    <p className="mt-2 text-xs leading-5 text-white/40">
                      {payment.notes}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState text="No payments recorded yet." />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="text-sm font-black text-white">Receipts</p>

          <div className="mt-4 space-y-3">
            {receipts.length ? (
              receipts.slice(0, 6).map((receipt) => (
                <div
                  key={receipt.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">
                        Receipt Upload
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {formatDate(receipt.created_at)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getStatusStyle(
                        receipt.status || receipt.review_status || "pending"
                      )}`}
                    >
                      {formatStatus(receipt.status || receipt.review_status || "pending")}
                    </span>
                  </div>

                  {receipt.receipt_url ? (
                    <a
                      href={receipt.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                    >
                      View Receipt
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState text="No receipts uploaded yet." />
            )}
          </div>
        </div>
      </div>
    </div>
  </Panel>
) : null}
          {activeTab === "overview" ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Journey Snapshot">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label="Name" value={summary.studentName} />
                  <InfoRow label="Email" value={summary.email || "Not added"} />
                  <InfoRow label="Phone" value={summary.phone || "Not added"} />
                  <InfoRow label="Type" value={formatStatus(summary.studentType)} />
                </div>

                <div className="mt-5 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                    Next Action
                  </p>

                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {actionCenterItems?.[0]?.title ||
                      pendingTasks?.[0]?.title ||
                      pendingTasks?.[0]?.description ||
                      "No urgent pending action is currently assigned."}
                  </p>

                  {actionCenterItems?.[0] ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab(actionCenterItems[0].targetTab || "actions")}
                      className="mt-4 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                    >
                      {actionCenterItems[0].action || "Open Action"}
                    </button>
                  ) : null}
                </div>
              </Panel>

              <Panel title="Latest Application">
                {latestApplication?.id ? (
                  <div className="space-y-3">
                    <InfoRow
                      label="University"
                      value={
                        latestApplication.university_name ||
                        latestApplication.university ||
                        "Not selected"
                      }
                    />
                    <InfoRow
                      label="Course"
                      value={
                        latestApplication.course_name ||
                        latestApplication.course ||
                        latestApplication.program ||
                        "Not selected"
                      }
                    />
                    <InfoRow
                      label="Application Status"
                      value={formatStatus(summary.applicationStatus)}
                    />
                    <InfoRow label="Offer Status" value={formatStatus(summary.offerStatus)} />
                  </div>
                ) : (
                  <EmptyState text="No application record is visible yet." />
                )}
              </Panel>
            </div>
          ) : null}

          {activeTab === "actions" ? (
            <Panel title="Student Action Center">
              <div className="grid gap-4 xl:grid-cols-4">
                <ActionStat label="Total Actions" value={actionCenterItems.length} />
                <ActionStat label="Urgent" value={urgentActions} urgent />
                <ActionStat label="Important" value={importantActions} warning />
                <ActionStat label="Health" value={`${analytics.overallHealth}%`} />
              </div>

              <div className="mt-5 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-black text-[#D4AF37]">What should I do next?</p>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      This center combines tasks, document status, application gaps, university planning, CAS readiness, visa readiness, and communication activity into one student action list.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("analytics")}
                    className="w-fit rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                  >
                    View Analytics
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-black text-white">Readiness Snapshot</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    These scores help show whether the student is ready for application, CAS, and visa stages.
                  </p>

                  <div className="mt-5 space-y-4">
                    <ProgressRow label="Application Readiness" value={readiness.applicationReadiness} />
                    <ProgressRow label="CAS Readiness" value={readiness.casReadiness} />
                    <ProgressRow label="Visa Readiness" value={readiness.visaReadiness} />
                    <ProgressRow label="Document Score" value={readiness.documentScore} />
                    <ProgressRow label="Task Score" value={readiness.taskScore} />
                  </div>
                </div>

                <div className="space-y-3">
                  {actionCenterItems.length ? (
                    actionCenterItems.map((item) => (
                      <ActionItem
                        key={item.id}
                        item={item}
                        onOpen={() => setActiveTab(item.targetTab || "overview")}
                      />
                    ))
                  ) : (
                    <EmptyState text="No actions are currently required." />
                  )}
                </div>
              </div>
            </Panel>
          ) : null}

          {activeTab === "roadmap" ? (
            <Panel title="Journey Roadmap">
              <div className="mb-5 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4">
  <div className="flex items-center justify-between">
    <span className="text-sm font-bold text-white">
      Overall Journey Progress
    </span>

    <span className="text-[#D4AF37] font-black">
      {journeyProgress}%
    </span>
  </div>

  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-[#D4AF37]"
      style={{ width: `${journeyProgress}%` }}
    />
  </div>
</div>
              <div className="grid gap-4 xl:grid-cols-3">
                <ReadinessCard title="Application Ready" value={readiness.applicationReadiness} />
                <ReadinessCard title="CAS Ready" value={readiness.casReadiness} />
                <ReadinessCard title="Visa Ready" value={readiness.visaReadiness} />
              </div>

              <div className="mt-5 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5">
                <p className="text-sm font-black text-[#D4AF37]">Student Journey Path</p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  The roadmap is generated from visible application, offer, CAS, and visa status. Completed steps are marked automatically.
                </p>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-7">
                {roadmap.map((step) => (
                  <JourneyStep
                    key={step.id}
                    step={step}
                    onOpen={() => setActiveTab(step.targetTab || "overview")}
                  />
                ))}
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-black text-white">Current Stage</p>
                  <p className="mt-3 text-2xl font-black text-[#D4AF37]">
                    {roadmap.find((step) => step.active)?.title || "Journey Complete"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    {roadmap.find((step) => step.active)?.description || "All visible journey stages are complete."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-black text-white">Milestones</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {roadmap.map((step) => (
                      <InfoRow
                        key={`milestone-${step.id}`}
                        label={step.title}
                        value={step.complete ? "Complete" : step.active ? "Current" : "Pending"}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          ) : null}


          {activeTab === "success" ? (
            <Panel title="Student Success Center">
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                    Current Journey Stage
                  </p>
                  <p className="mt-3 text-3xl font-black text-white">{successCenter.stageLabel}</p>
                  <p className="mt-3 text-sm leading-6 text-white/50">
                    This stage is inferred from your visible application, offer, CAS, and visa status.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                    Best Next Step
                  </p>
                  <p className="mt-3 text-xl font-black text-white">
                    {successCenter.activeAction?.title || "Check your portal regularly"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/50">
                    {successCenter.activeAction?.message || "No urgent guidance is currently visible."}
                  </p>

                  {successCenter.activeAction ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab(successCenter.activeAction.targetTab || "actions")}
                      className="mt-4 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                    >
                      {successCenter.activeAction.action || "Open"}
                    </button>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                    Portal Health
                  </p>
                  <p className="mt-3 text-3xl font-black text-white">{analytics.overallHealth}%</p>
                  <div className="mt-4">
                    <ProgressBar value={analytics.overallHealth} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/50">
                    Based on journey progress, documents, tasks, universities, communication, and alerts.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5">
                  <p className="text-sm font-black text-[#D4AF37]">Smart Guidance</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    These tips are generated from your visible Student OS data and readiness scores.
                  </p>

                  <div className="mt-5 space-y-3">
                    {successCenter.smartTips.map((item) => (
                      <SuccessTipCard
                        key={item.id}
                        item={item}
                        onOpen={() => setActiveTab(item.targetTab || "overview")}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-black text-white">Readiness Guide</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Use these scores to understand what affects application, CAS, and visa progress.
                  </p>

                  <div className="mt-5 space-y-4">
                    <ProgressRow label="Application Readiness" value={readiness.applicationReadiness} />
                    <ProgressRow label="CAS Readiness" value={readiness.casReadiness} />
                    <ProgressRow label="Visa Readiness" value={readiness.visaReadiness} />
                    <ProgressRow label="Document Score" value={readiness.documentScore} />
                    <ProgressRow label="Task Score" value={readiness.taskScore} />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-white">Student Help Library</p>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      Quick explanations for the most common student journey questions.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("actions")}
                    className="w-fit rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                  >
                    Open Action Center
                  </button>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  {successCenter.statusGuides.map((guide) => (
                    <SuccessGuideCard
                      key={guide.id}
                      guide={guide}
                      onOpen={() => setActiveTab(guide.targetTab || "overview")}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-5">
                <p className="text-sm font-black text-white">Common Questions</p>
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {successCenter.faqs.map((faq) => (
                    <FAQCard key={faq.question} faq={faq} />
                  ))}
                </div>
              </div>
            </Panel>
          ) : null}

          {activeTab === "deadlines" ? (
            <Panel title="Deadlines Center">
              <div className="grid gap-4 xl:grid-cols-4">
                <ActionStat label="Total Deadlines" value={deadlineCenter.items.length} />
                <ActionStat label="Urgent" value={deadlineCenter.urgentCount} urgent />
                <ActionStat label="Important" value={deadlineCenter.importantCount} warning />
                <ActionStat label="Overdue" value={deadlineCenter.overdueCount} urgent />
              </div>

              <div className="mt-5 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-black text-[#D4AF37]">Deadline Intelligence</p>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      This center reads task due dates, document dates, application deadlines, CAS timing, visa timing, and readiness risks from visible Student OS data.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("actions")}
                    className="w-fit rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                  >
                    Open Action Center
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-black text-white">Deadline Readiness</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Deadlines become risky when readiness is low. Keep documents, tasks, CAS, and visa preparation ahead of time.
                  </p>

                  <div className="mt-5 space-y-4">
                    <ProgressRow label="Application Readiness" value={readiness.applicationReadiness} />
                    <ProgressRow label="CAS Readiness" value={readiness.casReadiness} />
                    <ProgressRow label="Visa Readiness" value={readiness.visaReadiness} />
                    <ProgressRow label="Document Score" value={readiness.documentScore} />
                    <ProgressRow label="Task Score" value={readiness.taskScore} />
                  </div>
                </div>

                <div className="space-y-3">
                  {deadlineCenter.items.length ? (
                    deadlineCenter.items.map((item) => (
                      <DeadlineItem
                        key={item.id}
                        item={item}
                        onOpen={() => setActiveTab(item.targetTab || "overview")}
                      />
                    ))
                  ) : (
                    <EmptyState text="No deadlines are visible right now." />
                  )}
                </div>
              </div>
            </Panel>
          ) : null}

          {activeTab === "counselor" ? (
            <Panel title="Counselor Contact Center">
              <div className="grid gap-4 xl:grid-cols-3">
                <CounselorContactCard label="Assigned Counselor" value={counselorCenter.counselorName} />
                <CounselorContactCard label="Counselor Email" value={counselorCenter.counselorEmail} />
                <CounselorContactCard label="Counselor Phone / WhatsApp" value={counselorCenter.counselorPhone} />
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5">
                  <p className="text-sm font-black text-[#D4AF37]">Contact Guidance</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Use this section when you need help with rejected documents, urgent deadlines, application status, offer acceptance, CAS, or visa preparation.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoRow label="Portal Email" value={counselorCenter.portalEmail} />
                    <InfoRow label="Office Hours" value={counselorCenter.officeHours} />
                    <InfoRow label="Best Tab for Updates" value="Messages" />
                    <InfoRow label="Journey History" value="Timeline" />
                  </div>
                </div>

                <div className="space-y-3">
                  {counselorCenter.guidance.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-black/25 p-5">
                      <p className="font-black text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/25 p-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("messages")}
                  className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                >
                  Open Messages
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("timeline")}
                  className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/55 transition hover:border-[#D4AF37]/20 hover:text-white"
                >
                  View Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("actions")}
                  className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/55 transition hover:border-[#D4AF37]/20 hover:text-white"
                >
                  Check Actions
                </button>
              </div>
            </Panel>
          ) : null}



          {activeTab === "payments" ? (
            <Panel title="Payment Center">
              <div className="grid gap-4 xl:grid-cols-4">
                <MetricCard label="Invoice Total" value={formatMoney(totalInvoiceAmount, invoices[0]?.currency || payments[0]?.currency || "PKR")} />
                <MetricCard label="Paid" value={formatMoney(paidAmount, payments[0]?.currency || invoices[0]?.currency || "PKR")} />
                <MetricCard label="Pending" value={formatMoney(pendingAmount, invoices[0]?.currency || payments[0]?.currency || "PKR")} />
                <MetricCard label="Overdue" value={overdueInvoices.length} />
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-black text-white">Invoices</p>
                  <div className="mt-4 space-y-3">
                    {invoices.length ? invoices.map((invoice) => (
                      <RecordCard
                        key={invoice.id}
                        title={invoice.title || invoice.invoice_number || "Student Invoice"}
                        description={invoice.description || invoice.category || "Invoice record"}
                        meta={[
                          ["Amount", formatMoney(invoice.total_amount || invoice.amount, invoice.currency || "PKR")],
                          ["Status", formatStatus(invoice.status || "unpaid")],
                          ["Due", formatDate(invoice.due_date)],
                          ["Created", formatDate(invoice.created_at)],
                        ]}
                      />
                    )) : <EmptyState text="No invoices are visible yet." />}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-black text-white">Payments & Receipts</p>
                  <div className="mt-4 space-y-3">
                    {payments.length ? payments.map((payment) => (
                      <RecordCard
                        key={payment.id}
                        title={payment.reference || payment.payment_method || "Payment"}
                        description={payment.notes || "Confirmed payment record"}
                        meta={[
                          ["Amount", formatMoney(payment.amount, payment.currency || "PKR")],
                          ["Status", formatStatus(payment.status || "confirmed")],
                          ["Paid", formatDate(payment.paid_at || payment.created_at)],
                        ]}
                      />
                    )) : null}

                    {receipts.length ? receipts.map((receipt) => (
                      <RecordCard
                        key={receipt.id}
                        title={receipt.receipt_url ? "Receipt Uploaded" : "Receipt Submitted"}
                        description={receipt.notes || "Receipt waiting for Zaifan review"}
                        meta={[
                          ["Amount", formatMoney(receipt.amount, receipt.currency || "PKR")],
                          ["Status", formatStatus(receipt.status || receipt.review_status || "pending_review")],
                          ["Reference", receipt.reference || receipt.payment_reference || "Not added"],
                          ["Submitted", formatDate(receipt.submitted_at || receipt.created_at)],
                        ]}
                      />
                    )) : null}

                    {!payments.length && !receipts.length ? (
                      <EmptyState text="No payments or receipts are visible yet." />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <form onSubmit={handleReceiptUploadSubmit} className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-5">
                  <p className="text-sm font-black text-[#D4AF37]">Upload Payment Receipt</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Upload your payment proof here. The Zaifan team will review and approve it from Admin Payment Center.
                  </p>

                  {receiptUploadStatus.message ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/65">
                      {receiptUploadStatus.message}
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Invoice</span>
                      <select
                        value={receiptForm.invoiceId}
                        onChange={(event) => setReceiptForm((prev) => ({ ...prev, invoiceId: event.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      >
                        <option value="">General receipt / no invoice</option>
                        {invoices.map((invoice) => (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.title || invoice.invoice_number || "Invoice"} — {formatMoney(invoice.total_amount || invoice.amount, invoice.currency || "PKR")}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Amount</span>
                      <input
                        type="number"
                        value={receiptForm.amount}
                        onChange={(event) => setReceiptForm((prev) => ({ ...prev, amount: event.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Currency</span>
                      <input
                        value={receiptForm.currency}
                        onChange={(event) => setReceiptForm((prev) => ({ ...prev, currency: event.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Reference Number</span>
                      <input
                        value={receiptForm.reference}
                        onChange={(event) => setReceiptForm((prev) => ({ ...prev, reference: event.target.value }))}
                        placeholder="Transaction ID / bank reference"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Receipt File</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(event) => setReceiptForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                      {receiptForm.file ? (
                        <p className="text-xs text-emerald-300">
                          Selected: {receiptForm.file.name}
                        </p>
                      ) : null}
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Notes / Reference</span>
                      <textarea
                        value={receiptForm.notes}
                        onChange={(event) => setReceiptForm((prev) => ({ ...prev, notes: event.target.value }))}
                        className="min-h-[90px] w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/50"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={receiptUploadStatus.loading}
                    className="mt-4 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-black text-black disabled:opacity-50"
                  >
                    {receiptUploadStatus.loading ? "Uploading..." : "Submit Receipt"}
                  </button>
                </form>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-black text-white">Payment Accounts</p>
                  <div className="mt-4 space-y-3">
                    {paymentAccounts.length ? paymentAccounts.map((account) => (
                      <RecordCard
                        key={account.id}
                        title={account.account_title || account.bank_name || "Payment Account"}
                        description={account.instructions || "Use this account for manual payment."}
                        meta={[
                          ["Type", formatStatus(account.account_type || "account")],
                          ["Bank", account.bank_name],
                          ["Account", account.account_number || account.mobile_wallet_number],
                          ["IBAN", account.iban],
                        ]}
                      />
                    )) : <EmptyState text="No active payment accounts are visible yet." />}
                  </div>
                </div>
              </div>

              {paymentRequests.length ? (
                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-black text-white">Counselor Payment Requests</p>
                  <div className="mt-4 grid gap-3 xl:grid-cols-2">
                    {paymentRequests.map((request) => (
                      <RecordCard
                        key={request.id}
                        title={request.title || "Payment Request"}
                        description={request.message || request.notes || "Counselor requested a payment action."}
                        meta={[
                          ["Amount", formatMoney(request.amount, request.currency || "PKR")],
                          ["Status", formatStatus(request.status || "pending")],
                          ["Requested", formatDate(request.created_at)],
                        ]}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </Panel>
          ) : null}

          {activeTab === "profile" ? (
  <Panel title="Student Profile">
    <div className="space-y-6">

      <div>
        <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#D4AF37]">
          Personal Information
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoRow label="Full Name" value={summary.studentName} />
          <InfoRow label="Email" value={summary.email || "Not added"} />
          <InfoRow label="Phone" value={summary.phone || "Not added"} />
          <InfoRow label="Student ID" value={summary.studentId || "Not available"} />

          <InfoRow
            label="Student Type"
            value={formatStatus(summary.studentType)}
          />

          <InfoRow
            label="Portal Email"
            value={account?.email || "Not connected"}
          />

          <InfoRow
            label="Country"
            value={
              student?.country ||
              student?.country_interest ||
              student?.preferred_country ||
              "Not added"
            }
          />

          <InfoRow
            label="Interest"
            value={
              student?.field_of_interest ||
              student?.course ||
              student?.program ||
              student?.consultation_type ||
              "Not added"
            }
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#D4AF37]">
          Journey Status
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoRow
            label="Application"
            value={formatStatus(summary.applicationStatus)}
          />

          <InfoRow
            label="Offer"
            value={formatStatus(summary.offerStatus)}
          />

          <InfoRow
            label="CAS"
            value={formatStatus(summary.casStatus)}
          />

          <InfoRow
            label="Visa"
            value={formatStatus(summary.visaStatus)}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#D4AF37]">
          Student OS Progress
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InfoRow
            label="Documents"
            value={`${summary.documentsCount} Records`}
          />

          <InfoRow
            label="Tasks"
            value={`${summary.tasksCount} Records`}
          />

          <InfoRow
            label="Pending Tasks"
            value={`${summary.pendingTasksCount} Pending`}
          />

          <InfoRow
            label="Universities"
            value={`${summary.universitiesCount} Records`}
          />

          <InfoRow
            label="Messages"
            value={`${summary.communicationsCount} Records`}
          />

          <InfoRow
            label="Timeline"
            value={`${summary.timelineCount} Events`}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#D4AF37]">
          Portal Information
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoRow
            label="Portal Account"
            value={
              account?.is_active === false
                ? "Inactive"
                : "Active"
            }
          />

          <InfoRow
            label="Login Mode"
            value={
              sessionMode === "account"
                ? "Account Login"
                : "Legacy Lookup"
            }
          />

          <InfoRow
            label="Record Source"
            value={formatStatus(summary.studentType)}
          />

          <InfoRow
            label="Created"
            value={formatDate(
              student?.created_at ||
              student?.appointment_date
            )}
          />
        </div>
      </div>
    </div>
  </Panel>
) : null}

          {activeTab === "applications" ? (
            <RecordGrid
              title="Applications"
              rows={applications}
              empty="No applications are visible yet."
              render={(row) => (
                <RecordCard
                  title={row.university_name || row.university || row.course_name || "Application"}
                  description={row.course_name || row.course || row.program || "Application record"}
                  meta={[
                    ["Application", formatStatus(row.application_status || row.status)],
                    ["Offer", formatStatus(row.offer_status)],
                    ["CAS", formatStatus(row.cas_status)],
                    ["Visa", formatStatus(row.visa_status)],
                    ["Updated", formatDate(row.updated_at || row.created_at)],
                  ]}
                />
              )}
            />
          ) : null}

          {activeTab === "visa" ? (
            <RecordGrid
              title="Visa Tracking"
              rows={applications}
              empty="No visa tracking record is visible yet."
              render={(row) => (
                <RecordCard
                  title={row.university_name || row.university || "Visa Record"}
                  description={row.course_name || row.course || row.program || "Visa journey record"}
                  meta={[
                    ["Visa", formatStatus(row.visa_status)],
                    ["CAS", formatStatus(row.cas_status)],
                    ["Offer", formatStatus(row.offer_status)],
                    ["Application", formatStatus(row.application_status || row.status)],
                    ["Updated", formatDate(row.updated_at || row.created_at)],
                  ]}
                />
              )}
            />
          ) : null}

          {activeTab === "documents" ? (
            <RecordGrid
              title="Documents"
              rows={documents}
              empty="No documents are uploaded yet."
              render={(row) => (
                <RecordCard
                  title={row.document_name || row.file_name || row.title || "Document"}
                  description={row.notes || row.description || row.status || "Student document"}
                  meta={[
                    ["Status", formatStatus(row.status || row.document_status)],
                    ["Uploaded", formatDate(row.created_at)],
                  ]}
                />
              )}
            />
          ) : null}

          {activeTab === "tasks" ? (
            <RecordGrid
              title="Tasks"
              rows={tasks}
              empty="No tasks are assigned yet."
              render={(row) => (
                <RecordCard
                  title={row.title || "Task"}
                  description={row.description || row.notes || "Student task"}
                  meta={[
                    ["Status", formatStatus(row.status)],
                    ["Priority", formatStatus(row.priority)],
                    ["Due", formatDate(row.due_date)],
                  ]}
                />
              )}
            />
          ) : null}

          {activeTab === "universities" ? (
            <RecordGrid
              title="Universities"
              rows={universities}
              empty="No universities are planned yet."
              render={(row) => (
                <RecordCard
                  title={row.university_name || row.name || "University"}
                  description={row.course_name || row.course || row.country || "University option"}
                  meta={[
                    ["Category", formatStatus(row.category || row.university_type)],
                    ["Status", formatStatus(row.status)],
                    ["Country", row.country || "Not set"],
                  ]}
                />
              )}
            />
          ) : null}

          {activeTab === "messages" ? (
            <RecordGrid
              title="Messages"
              rows={communications}
              empty="No messages are visible yet."
              render={(row) => (
                <RecordCard
                  title={row.subject || formatStatus(row.channel) || "Message"}
                  description={row.message || row.body || row.notes || "Message record"}
                  meta={[
                    ["Channel", formatStatus(row.channel)],
                    ["Status", formatStatus(row.status)],
                    ["Created", formatDate(row.created_at)],
                  ]}
                />
              )}
            />
          ) : null}

          {activeTab === "timeline" ? (
            <RecordGrid
              title="Timeline"
              rows={timeline}
              empty="No timeline events yet."
              render={(row) => (
                <RecordCard
                  title={row.title || formatStatus(row.action_type) || "Timeline Event"}
                  description={row.description || row.new_value || row.old_value || "Timeline record"}
                  meta={[
                    ["Action", formatStatus(row.action_type)],
                    ["Date", formatDate(row.created_at)],
                    ["By", row.created_by_name || "Zaifan Team"],
                  ]}
                />
              )}
            />
          ) : null}


          {activeTab === "analytics" ? (
            <Panel title="Student Analytics">
              <div className="grid gap-4 xl:grid-cols-3">
                <AnalyticsCard
                  title="Overall Student Health"
                  value={analytics.overallHealth}
                  note="Combined score from journey, documents, tasks, universities, communications, and alerts."
                  highlight
                />

                <AnalyticsCard
                  title="Journey Completion"
                  value={analytics.journeyScore}
                  note="Tracks application, offer, CAS, and visa progress."
                />

                <AnalyticsCard
                  title="Document Readiness"
                  value={analytics.documentReadiness}
                  note={`${analytics.approvedDocuments} approved of ${documents.length || 0} visible document(s).`}
                />
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <ReadinessCard title="Application Readiness" value={readiness.applicationReadiness} />
                <ReadinessCard title="CAS Readiness" value={readiness.casReadiness} />
                <ReadinessCard title="Visa Readiness" value={readiness.visaReadiness} />
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <AnalyticsCard
                  title="Task Completion"
                  value={analytics.taskCompletion}
                  note={`${analytics.completedTasks} completed of ${tasks.length || 0} visible task(s).`}
                />

                <AnalyticsCard
                  title="University Planning"
                  value={analytics.universityPlanning}
                  note={`${universities.length || 0} university option(s) visible in Student OS.`}
                />

                <AnalyticsCard
                  title="Communication Activity"
                  value={analytics.communicationActivity}
                  note={`${communications.length || 0} message(s), ${timeline.length || 0} timeline event(s).`}
                />
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-sm font-black text-white">Progress Breakdown</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    This breakdown uses visible Student OS records only. Admin-only notes and private internal data stay hidden from the student portal.
                  </p>

                  <div className="mt-5 space-y-4">
                    <ProgressRow label="Journey" value={analytics.journeyScore} />
                    <ProgressRow label="Documents" value={analytics.documentReadiness} />
                    <ProgressRow label="Tasks" value={analytics.taskCompletion} />
                    <ProgressRow label="Universities" value={analytics.universityPlanning} />
                    <ProgressRow label="Communication" value={analytics.communicationActivity} />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-[#D4AF37]">Recommended Focus</p>
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        Smart student-facing recommendations based on your visible portal data.
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37]">
                      {analytics.notificationPressure} Alert Signals
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {analytics.recommendations.map((item) => (
                      <RecommendationCard
                        key={`${item.title}-${item.targetTab}`}
                        item={item}
                        onOpen={() => setActiveTab(item.targetTab || "overview")}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-4">
                <InfoRow label="Overdue Tasks" value={`${analytics.overdueTasks} task(s)`} />
                <InfoRow label="Urgent Alerts" value={`${urgentNotifications} alert(s)`} />
                <InfoRow label="Warning Alerts" value={`${warningNotifications} alert(s)`} />
                <InfoRow label="Portal Sync" value={loadingData ? "Refreshing" : "Ready"} />
              </div>
            </Panel>
          ) : null}

          {activeTab === "insights" ? (
            <Panel title="Executive Insights">
              <div className="grid gap-4 xl:grid-cols-2">
                {executiveSignals.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                      {item.title}
                    </p>
                    <p className="mt-3 text-2xl font-black text-white">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-white/45">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-5">
                <p className="text-sm font-black text-white">Portal Intelligence Note</p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  This tab is the student-facing foundation for Executive AI visibility. Later,
                  Admin OS can choose which insights students are allowed to see.
                </p>
              </div>
            </Panel>
          ) : null}

          {activeTab === "notifications" ? (
            <Panel title="Student Notifications Center">
              <div className="grid gap-4 xl:grid-cols-4">
                <NotificationStat label="Total Notifications" value={notifications.length} />
                <NotificationStat label="Urgent" value={urgentNotifications} urgent />
                <NotificationStat label="Alerts" value={warningNotifications} warning />
                <NotificationStat label="Messages" value={communications.length} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/25 p-3">
                {notificationFilters.map(([id, label, count]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setNotificationFilter(id)}
                    className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                      notificationFilter === id
                        ? "bg-[#D4AF37] text-black"
                        : "border border-white/10 bg-white/[0.035] text-white/45 hover:border-[#D4AF37]/25 hover:text-white"
                    }`}
                  >
                    {label} {Number(count) ? `(${count})` : ""}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5">
                <p className="text-sm font-black text-[#D4AF37]">Notification Intelligence</p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Showing {filteredNotifications.length} of {notifications.length} notification(s).
                  Use filters to focus on urgent work, documents, tasks, applications, visa updates, and messages.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {filteredNotifications.length ? (
                  filteredNotifications.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      onOpen={() => goToNotificationTarget(item)}
                    />
                  ))
                ) : (
                  <EmptyState text="No notifications match this filter." />
                )}
              </div>
            </Panel>
          ) : null}

          {activeTab === "settings" ? (
            <Panel title="Portal Settings">
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                        Account Status
                      </p>
                      <p className="mt-3 text-2xl font-black text-white">
                        {sessionMode === "account" ? "Secure Login" : "Legacy Access"}
                      </p>
                    </div>

                    <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                      Active
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/55">
                    {sessionMode === "account"
                      ? "This portal session is linked to an active student portal account."
                      : "This portal session is using legacy lookup while account migration continues."}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                    Linked Student Record
                  </p>
                  <p className="mt-3 text-2xl font-black text-white">
                    {formatStatus(summary.studentType)} #{summary.studentId || "N/A"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    Your portal reads directly from your Zaifan Student OS record.
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
                    Session Status
                  </p>
                  <p className="mt-3 text-2xl font-black text-white">
                    {loadingData ? "Syncing" : "Ready"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    {loadingData
                      ? "Latest Student OS data is currently refreshing."
                      : "Your visible student data has loaded successfully."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-white">Account Details</p>
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        Your access details and linked student identity.
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37]">
                      {sessionMode === "account" ? "Email Login" : "Legacy Mode"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoRow label="Portal Email" value={account?.email || summary.email || "Legacy session"} />
                    <InfoRow label="Login Mode" value={sessionMode === "account" ? "Email + Password" : "Legacy Lookup"} />
                    <InfoRow label="Student Name" value={summary.studentName} />
                    <InfoRow label="Linked Record" value={`${formatStatus(summary.studentType)} #${summary.studentId || "N/A"}`} />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-white">Portal Visibility</p>
                      <p className="mt-2 text-sm leading-6 text-white/45">
                        These sections are currently visible from your Student OS record.
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                      Live Data
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <InfoRow label="Applications" value={summary.applicationStatus ? formatStatus(summary.applicationStatus) : "Visible"} />
                    <InfoRow label="Documents" value={`${summary.documentsCount || 0} visible`} />
                    <InfoRow label="Tasks" value={`${summary.tasksCount || 0} visible`} />
                    <InfoRow label="Universities" value={`${summary.universitiesCount || 0} visible`} />
                    <InfoRow label="Messages" value={`${summary.communicationsCount || 0} visible`} />
                    <InfoRow label="Timeline" value={`${summary.timelineCount || 0} visible`} />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-5">
                  <p className="text-sm font-black text-[#D4AF37]">Security</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Portal access is verified before opening student data. Keep your login details private and logout on shared devices.
                  </p>

                  <div className="mt-4 space-y-3">
                    <InfoRow label="Access Type" value={sessionMode === "account" ? "Verified portal account" : "Legacy lookup session"} />
                    <InfoRow label="Account State" value={account?.is_active === false ? "Inactive" : "Active"} />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-400/15 bg-blue-500/10 p-5">
                  <p className="text-sm font-black text-blue-300">Data Permissions</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Students can only see portal-safe information connected to their own Student OS journey.
                  </p>

                  <div className="mt-4 space-y-3">
                    <InfoRow label="Profile" value="Visible" />
                    <InfoRow label="Internal Admin Notes" value="Hidden" />
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-400/15 bg-orange-500/10 p-5">
                  <p className="text-sm font-black text-orange-300">Password Change</p>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Secure password-change UI is ready here. Backend connection is handled through the optional onPasswordChange action from StudentPortalPage.
                  </p>

                  <form onSubmit={handlePasswordChangeSubmit} className="mt-4 space-y-3">
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                      placeholder="Current password"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/40"
                    />

                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      placeholder="New password"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/40"
                    />

                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      placeholder="Confirm new password"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/40"
                    />

                    {passwordStatus.message ? (
                      <div
                        className={`rounded-2xl border p-3 text-sm ${
                          passwordStatus.type === "success"
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                            : passwordStatus.type === "info"
                              ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
                              : "border-orange-400/20 bg-orange-500/10 text-orange-200"
                        }`}
                      >
                        {passwordStatus.message}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={passwordStatus.loading || sessionMode !== "account"}
                      className="w-full rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-orange-200 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {passwordStatus.loading ? "Updating..." : "Update Password"}
                    </button>
                  </form>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
                      Current Status
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      {sessionMode === "account"
                        ? "Account login is active. UI validation is ready; connect backend action for real password updates."
                        : "Legacy lookup remains enabled during migration. Password change unlocks after account login migration."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-black text-white">Portal Health Summary</p>
                    <p className="mt-2 text-sm leading-6 text-white/45">
                      Your portal is connected to applications, documents, tasks, universities, communications, timeline events, and student notifications.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Account</p>
                      <p className="mt-2 text-sm font-black text-white">Active</p>
                    </div>
                    <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D4AF37]">Notifications</p>
                      <p className="mt-2 text-sm font-black text-white">{notifications.length}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">Refresh</p>
                      <p className="mt-2 text-sm font-black text-white">{loadingData ? "Syncing" : "Ready"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          ) : null}

        </main>
      </div>
    </section>
  );
}

function QuickLaunchCard({ label, value, onOpen = () => {} }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-[#D4AF37]/25 hover:bg-[#D4AF37]/[0.04]"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 line-clamp-2 text-sm font-black text-white">
        {value || "Open"}
      </p>
    </button>
  );
}

function StatusCard({ title, value }) {
  return (
    <div className={`rounded-2xl border p-5 ${getStatusStyle(value)}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{title}</p>
      <p className="mt-3 text-xl font-black">{formatStatus(value)}</p>
    </div>
  );
}

function MetricCard({ label, value, warning = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        warning
          ? "border-orange-400/20 bg-orange-500/10"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value || 0}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-white/75">
        {value || "Not added"}
      </p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-white/40">
      {text}
    </div>
  );
}

function RecordGrid({ title, rows = [], empty, render }) {
  return (
    <Panel title={title}>
      {rows.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((row, index) => (
            <div key={row.id || `${title}-${index}`}>{render(row)}</div>
          ))}
        </div>
      ) : (
        <EmptyState text={empty} />
      )}
    </Panel>
  );
}

function RecordCard({ title, description, meta = [] }) {
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-black/25 p-5">
      <h3 className="break-words font-black text-white">{title}</h3>

      <p className="mt-2 line-clamp-4 text-sm leading-6 text-white/45">
        {description || "No extra details."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {meta
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <span
              key={`${label}-${value}`}
              className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[11px] text-white/45"
            >
              {label}: {value}
            </span>
          ))}
      </div>
    </div>
  );
}



function ActionStat({ label, value, urgent = false, warning = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        urgent
          ? "border-red-400/25 bg-red-500/10"
          : warning
            ? "border-orange-400/25 bg-orange-500/10"
            : "border-white/10 bg-black/25"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value || 0}</p>
    </div>
  );
}

function ActionItem({ item, onOpen = () => {} }) {
  const styles = {
    urgent: "border-red-400/25 bg-red-500/10",
    important: "border-orange-400/25 bg-orange-500/10",
    normal: "border-blue-400/25 bg-blue-500/10",
    success: "border-emerald-400/25 bg-emerald-500/10",
  };

  const badgeStyles = {
    urgent: "border-red-400/25 bg-red-500/10 text-red-300",
    important: "border-orange-400/25 bg-orange-500/10 text-orange-300",
    normal: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[item.priority] || "border-white/10 bg-black/25"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${badgeStyles[item.priority] || "border-white/10 bg-white/[0.04] text-white/45"}`}>
              {formatStatus(item.priority)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
              {item.source}
            </span>
          </div>
          <p className="mt-3 font-black text-white">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-white/50">{item.message}</p>
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <p className="text-xs text-white/35">{formatDate(item.date)}</p>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
          >
            {item.action}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReadinessCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
        {title}
      </p>
      <div className="mt-4 flex items-end gap-2">
        <p className="text-4xl font-black text-white">{clampPercent(value)}</p>
        <p className="pb-1 text-sm font-black text-white/35">%</p>
      </div>
      <div className="mt-4">
        <ProgressBar value={value} />
      </div>
    </div>
  );
}

function JourneyStep({ step, onOpen = () => {} }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`rounded-2xl border p-4 text-left transition ${
        step.complete
          ? "border-emerald-400/25 bg-emerald-500/10"
          : step.active
            ? "border-[#D4AF37]/30 bg-[#D4AF37]/10"
            : "border-white/10 bg-black/25 hover:border-[#D4AF37]/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${
            step.complete
              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
              : step.active
                ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
                : "border-white/10 bg-white/[0.035] text-white/35"
          }`}
        >
          {step.complete ? "✓" : step.index + 1}
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
          {step.active ? "Current" : step.complete ? "Done" : "Pending"}
        </span>
      </div>
      <p className="mt-4 text-sm font-black text-white">{step.title}</p>
      <p className="mt-2 text-xs leading-5 text-white/45">{step.description}</p>
    </button>
  );
}

function DeadlineItem({ item, onOpen = () => {} }) {
  const styles = {
    urgent: "border-red-400/25 bg-red-500/10",
    important: "border-orange-400/25 bg-orange-500/10",
    normal: "border-blue-400/25 bg-blue-500/10",
    success: "border-emerald-400/25 bg-emerald-500/10",
  };

  const badgeStyles = {
    urgent: "border-red-400/25 bg-red-500/10 text-red-300",
    important: "border-orange-400/25 bg-orange-500/10 text-orange-300",
    normal: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[item.priority] || "border-white/10 bg-black/25"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${badgeStyles[item.priority] || "border-white/10 bg-white/[0.04] text-white/45"}`}>
              {formatStatus(item.priority)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
              {item.source}
            </span>
            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37]">
              {item.label}
            </span>
          </div>

          <p className="mt-3 font-black text-white">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-white/50">{item.message}</p>
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <p className="text-xs text-white/35">{formatDate(item.date)}</p>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
          >
            {item.action}
          </button>
        </div>
      </div>
    </div>
  );
}

function CounselorContactCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-3 break-words text-xl font-black text-white">{value || "Not added"}</p>
    </div>
  );
}

function AnalyticsCard({ title, value, note, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-[#D4AF37]/25 bg-[#D4AF37]/10"
          : "border-white/10 bg-black/25"
      }`}
    >
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${highlight ? "text-[#D4AF37]" : "text-white/35"}`}>
        {title}
      </p>
      <div className="mt-4 flex items-end gap-2">
        <p className="text-4xl font-black text-white">{value}</p>
        <p className="pb-1 text-sm font-black text-white/35">%</p>
      </div>
      <div className="mt-4">
        <ProgressBar value={value} />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/45">{note}</p>
    </div>
  );
}

function ProgressBar({ value = 0 }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
        style={{ width: `${clampPercent(value)}%` }}
      />
    </div>
  );
}

function ProgressRow({ label, value = 0 }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">{label}</p>
        <p className="text-xs font-black text-[#D4AF37]">{clampPercent(value)}%</p>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function RecommendationCard({ item, onOpen = () => {} }) {
  const styles = {
    urgent: "border-red-400/25 bg-red-500/10",
    warning: "border-orange-400/25 bg-orange-500/10",
    success: "border-emerald-400/25 bg-emerald-500/10",
    info: "border-blue-400/25 bg-blue-500/10",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[item.type] || "border-white/10 bg-black/25"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black text-white">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-white/50">{item.message}</p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="w-fit shrink-0 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
        >
          {item.action}
        </button>
      </div>
    </div>
  );
}



function SuccessTipCard({ item, onOpen = () => {} }) {
  const styles = {
    urgent: "border-red-400/25 bg-red-500/10",
    warning: "border-orange-400/25 bg-orange-500/10",
    success: "border-emerald-400/25 bg-emerald-500/10",
    info: "border-blue-400/25 bg-blue-500/10",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[item.type] || "border-white/10 bg-black/25"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black text-white">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-white/50">{item.message}</p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="w-fit shrink-0 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
        >
          {item.action}
        </button>
      </div>
    </div>
  );
}

function SuccessGuideCard({ guide, onOpen = () => {} }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37]">
        {guide.category}
      </span>

      <h3 className="mt-4 font-black text-white">{guide.title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/50">{guide.message}</p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45 transition hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
      >
        {guide.action}
      </button>
    </div>
  );
}

function FAQCard({ faq }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <p className="font-black text-white">{faq.question}</p>
      <p className="mt-2 text-sm leading-6 text-white/50">{faq.answer}</p>
    </div>
  );
}

function NotificationStat({ label, value, urgent = false, warning = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        urgent
          ? "border-red-400/25 bg-red-500/10"
          : warning
            ? "border-orange-400/25 bg-orange-500/10"
            : "border-white/10 bg-black/25"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value || 0}</p>
    </div>
  );
}

function NotificationItem({ item, onOpen = () => {} }) {
  const styles = {
    urgent: "border-red-400/25 bg-red-500/10",
    warning: "border-orange-400/25 bg-orange-500/10",
    success: "border-emerald-400/25 bg-emerald-500/10",
    info: "border-blue-400/25 bg-blue-500/10",
    neutral: "border-white/10 bg-black/25",
  };

  const badgeStyles = {
    urgent: "border-red-400/25 bg-red-500/10 text-red-300",
    warning: "border-orange-400/25 bg-orange-500/10 text-orange-300",
    success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    info: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    neutral: "border-white/10 bg-white/[0.04] text-white/45",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[item.type] || styles.neutral}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${badgeStyles[item.type] || badgeStyles.neutral}`}>
              {formatStatus(item.type)}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
              {item.source}
            </span>
          </div>

          <h3 className="mt-3 font-black text-white">{item.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/55">
            {item.message}
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <p className="text-xs text-white/35">{formatDate(item.date)}</p>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
          >
            {item.action}
          </button>
        </div>
      </div>
    </div>
  );
}

function SupportTimelineCard({ event }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black text-white">{event.title}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/55">
            {event.message || "No extra details."}
          </p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(event.status || event.type)}`}>
          {formatStatus(event.type || event.status)}
        </span>
      </div>
      <p className="mt-3 text-xs text-white/35">{formatDate(event.date)}</p>
    </div>
  );
}

function SupportRequestHistoryCard({ request }) {
  const meta = getSupportRequestTypeMeta(request.request_type);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-black text-white">
            {meta.icon} {request.subject || meta.subject}
          </p>
          <p className="mt-1 text-sm leading-6 text-white/55">
            {request.message || meta.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(request.status || "open")}`}>
            {formatStatus(request.status || "open")}
          </span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
            {formatStatus(request.priority || meta.priority || "normal")}
          </span>
        </div>
      </div>

      {request.counselor_response ? (
        <div className="mt-4 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">
            Counselor Response
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/80">
            {request.counselor_response}
          </p>
          <p className="mt-3 text-xs text-white/40">
            Responded: {formatDate(request.responded_at || request.updated_at)}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm text-blue-200">
          Waiting for counselor response. Zaifan team can see this request in Admin Support Requests.
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/40">
        <span>Submitted: {formatDate(request.created_at)}</span>
        {request.resolved_at ? <span>Resolved: {formatDate(request.resolved_at)}</span> : null}
      </div>
    </div>
  );
}

export default StudentPortalDashboard;