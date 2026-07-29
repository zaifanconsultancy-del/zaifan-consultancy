import { useDeferredValue, useEffect, useMemo, useState } from "react";
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


function getFirstName(value = "") {
  const clean = String(value || "").trim();
  return clean ? clean.split(/\s+/)[0] : "Student";
}

function getTaskNamedPerson(title = "") {
  const clean = String(title || "").trim();
  const match = clean.match(/follow\s+up\s+with\s+([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){1,3})/i);
  return match?.[1]?.trim() || "";
}

function namesMatch(left = "", right = "") {
  const normalizeName = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");

  const a = normalizeName(left);
  const b = normalizeName(right);
  return Boolean(a && b && a === b);
}

function makeStudentSafeTaskCopy(task = {}, studentName = "") {
  const originalTitle = String(task?.title || "").trim();
  const originalMessage = String(task?.description || task?.notes || "").trim();
  const namedPerson = getTaskNamedPerson(originalTitle);
  const hasIdentityMismatch =
    Boolean(namedPerson) &&
    Boolean(studentName) &&
    !namesMatch(namedPerson, studentName);

  if (hasIdentityMismatch) {
    return {
      title: "Follow up on your study-abroad application",
      message:
        "Review your current application and visa next steps with your counselor. Ask about anything that is unclear before moving forward.",
      identityMismatch: true,
      originalNamedPerson: namedPerson,
    };
  }

  return {
    title: originalTitle || "Student Task",
    message:
      originalMessage ||
      "This task is connected to your student journey and needs your attention.",
    identityMismatch: false,
    originalNamedPerson: "",
  };
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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (["rejected", "refused", "cancelled", "failed", "missing"].includes(clean)) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (["pending", "under_review", "submitted", "processing", "in_progress"].includes(clean)) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (["offer_received", "cas_issued", "accepted"].includes(clean)) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-slate-200 bg-white text-slate-950/55";
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
  studentName = "",
}) {
  const actions = [];
  const completeStatuses = ["done", "completed", "complete", "closed", "approved", "issued"];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  tasks.forEach((task) => {
    const status = normalize(task.status);
    const isComplete = completeStatuses.includes(status);
    const isOverdue =
      task.due_date &&
      !isComplete &&
      new Date(task.due_date).getTime() < todayStart.getTime();

    const safeTask = makeStudentSafeTaskCopy(task, studentName);

    if (isOverdue) {
      actions.push({
        id: `overdue-task-${task.id}`,
        priority: "urgent",
        title: safeTask.title || "Overdue Task",
        message:
          safeTask.message ||
          "This task is overdue and needs attention.",
        date: task.due_date,
        source: "Tasks",
        targetTab: "tasks",
        action: "Open Tasks",
        identityMismatch: safeTask.identityMismatch,
      });
      return;
    }

    if (
      !isComplete &&
      ["pending", "todo", "to_do", "open", "in_progress", "not_started"].includes(status)
    ) {
      actions.push({
        id: `pending-task-${task.id}`,
        priority: "important",
        title: safeTask.title || "Pending Task",
        message: safeTask.message || "This task is still pending.",
        date: task.due_date || task.created_at,
        source: "Tasks",
        targetTab: "tasks",
        action: "Open Tasks",
        identityMismatch: safeTask.identityMismatch,
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
  studentForDeadlineSafety = null,
}) {
  const items = [];
  const completeStatuses = ["done", "completed", "complete", "closed", "approved", "issued"];

  tasks.forEach((task) => {
    const status = normalize(task.status);
    if (completeStatuses.includes(status)) return;

    const meta = getDeadlineMeta(task.due_date);
    const safeTask = makeStudentSafeTaskCopy(
      task,
      getStudentDisplayName(studentForDeadlineSafety || {})
    );

    items.push({
      id: `task-deadline-${task.id || task.title}`,
      title: safeTask.title || "Task Deadline",
      message:
        safeTask.message ||
        "A task deadline is connected to your student journey.",
      source: "Tasks",
      targetTab: "tasks",
      action: "Open Tasks",
      identityMismatch: safeTask.identityMismatch,
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



function buildOperationsBridge({
  student = {},
  account = null,
  applications = [],
  documents = [],
  tasks = [],
  communications = [],
  timeline = [],
  supportRequests = [],
  invoices = [],
  payments = [],
  receipts = [],
  paymentRequests = [],
  counselorCenter = {},
  loadingData = false,
}) {
  const studentId = getPortalStudentId(student);
  const sharedRecords =
    applications.length +
    documents.length +
    tasks.length +
    communications.length +
    timeline.length +
    supportRequests.length +
    invoices.length +
    payments.length +
    receipts.length +
    paymentRequests.length;

  const counselorIdentityVisible =
    Boolean(student.counselor_name) ||
    Boolean(student.assigned_counselor) ||
    Boolean(student.assigned_to_name) ||
    Boolean(student.counselor_email) ||
    Boolean(student.assigned_counselor_email);

  const counselorResponses = supportRequests.filter((request) =>
    Boolean(request?.counselor_response)
  ).length;

  const adminWorkflowRecords =
    applications.length +
    documents.length +
    tasks.length +
    invoices.length +
    payments.length +
    receipts.length +
    paymentRequests.length +
    supportRequests.length;

  const counselorWorkflowRecords =
    communications.length +
    supportRequests.length +
    counselorResponses;

  return {
    studentId,
    portalAccount: account?.email || student.email || student.student_email || "",
    sharedRecords,
    adminWorkflowRecords,
    counselorWorkflowRecords,
    counselorResponses,
    counselorIdentityVisible,
    adminStatus: studentId ? "Shared workflow ready" : "Student identity missing",
    counselorStatus:
      counselorIdentityVisible || communications.length || supportRequests.length
        ? "Counselor channel active"
        : "Waiting for counselor activity",
    syncStatus: loadingData ? "Syncing latest data" : "Portal data loaded",
    counselorName: counselorCenter?.counselorName || "Zaifan Counselor",
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
  const deferredNotificationFilter = useDeferredValue(notificationFilter);
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
  const tasks = asPortalArray(portalData?.tasks).map((task) => {
    const safeTask = makeStudentSafeTaskCopy(
      task,
      getStudentDisplayName(student)
    );

    return {
      ...task,
      title: safeTask.title,
      description: safeTask.message,
      _studentPortalIdentityMismatch: safeTask.identityMismatch,
      _studentPortalOriginalTitle: task?.title || "",
    };
  });
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
    () => notifications.filter((item) => notificationMatchesFilter(item, deferredNotificationFilter)),
    [notifications, deferredNotificationFilter]
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
        studentName: getStudentDisplayName(student),
      }),
    [
      summary,
      applications,
      documents,
      tasks,
      universities,
      communications,
      analytics,
      readiness,
      student,
    ]
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
        studentForDeadlineSafety: student,
      }),
    [applications, documents, tasks, readiness, student]
  );

  const counselorCenter = useMemo(
    () => buildCounselorCenter({ student, account }),
    [student, account]
  );

  const operationsBridge = useMemo(
    () =>
      buildOperationsBridge({
        student,
        account,
        applications,
        documents,
        tasks,
        communications,
        timeline,
        supportRequests,
        invoices,
        payments,
        receipts,
        paymentRequests,
        counselorCenter,
        loadingData,
      }),
    [
      student,
      account,
      applications,
      documents,
      tasks,
      communications,
      timeline,
      supportRequests,
      invoices,
      payments,
      receipts,
      paymentRequests,
      counselorCenter,
      loadingData,
    ]
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
        message: "Support request submitted. It is now available to the Zaifan operations team and assigned counselor workflow.",
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
  const primaryNavItems = [
    ["overview", "Overview"],
    ["actions", `Action Center${urgentActions ? ` (${urgentActions})` : ""}`],
    ["applications", "Applications"],
    ["documents", "Documents"],
    ["tasks", "Tasks"],
    ["visa", "Visa"],
    ["support", `Support${supportRequests.length ? ` (${supportRequests.length})` : ""}`],
    ["payments", "Payments"],
  ];

  const studentToolGroups = [
    {
      id: "journey",
      eyebrow: "Journey",
      title: "Plan & Progress",
      description: "Everything connected to your study-abroad journey.",
      tone: "navy",
      items: [
        ["roadmap", "Journey Roadmap", `${journeyProgress}% complete`],
        ["deadlines", "Deadlines", `${deadlineCenter.urgentCount} urgent`],
        ["universities", "Universities", `${summary.universitiesCount || 0} options`],
        ["success", "Success Center", successCenter.stageLabel],
      ],
    },
    {
      id: "communication",
      eyebrow: "People",
      title: "Guidance & Support",
      description: "Stay connected with Zaifan and your counselor.",
      tone: "orange",
      items: [
        ["counselor", "My Counselor", counselorCenter.counselorName],
        ["messages", "Messages", `${summary.communicationsCount || 0} updates`],
        ["notifications", "Notifications", `${notifications.length} alerts`],
        ["connections", "Zaifan Team Bridge", `${operationsBridge.sharedRecords} shared`],
      ],
    },
    {
      id: "intelligence",
      eyebrow: "Insights",
      title: "My Student Intelligence",
      description: "Understand readiness, history and portal signals.",
      tone: "violet",
      items: [
        ["analytics", "Analytics", `${analytics.overallHealth}% health`],
        ["insights", "Executive Insights", "Smart guidance"],
        ["timeline", "Timeline", `${summary.timelineCount || 0} events`],
        ["profile", "Profile", summary.studentId ? `#${summary.studentId}` : "Student"],
      ],
    },
    {
      id: "account",
      eyebrow: "Account",
      title: "Security & Controls",
      description: "Control your account and portal preferences.",
      tone: "green",
      items: [
        ["settings", "Settings", sessionMode === "account" ? "Account login" : "Legacy session"],
        ["profile", "Identity", account?.email || summary.email || "Student profile"],
        ["notifications", "Alert Center", `${urgentNotifications + warningNotifications} active`],
        ["connections", "Live Sync", loadingData ? "Refreshing..." : "Connected"],
      ],
    },
  ];

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
    <section className="relative min-h-screen overflow-hidden bg-[#fff5e9] px-3 py-4 text-slate-950 sm:px-5 sm:py-6 lg:px-6">
      <div className="pointer-events-none absolute right-[-16%] top-[-12%] h-[460px] w-[460px] rounded-full bg-orange-200/30 blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-20%] h-[420px] w-[420px] rounded-full bg-blue-50 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1800px]">
        <header className="relative overflow-hidden rounded-[2.2rem] border-[3px] border-[#123b5d] bg-[#123b5d] shadow-[0_26px_80px_rgba(16,47,77,0.18)]">
          <div className="pointer-events-none absolute -left-20 -top-28 h-80 w-80 rounded-full bg-orange-400/14 blur-3xl" />
          <div className="pointer-events-none absolute left-[38%] top-[-55%] h-96 w-96 rounded-full bg-sky-300/10 blur-3xl" />

          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative p-5 sm:p-7 lg:p-8 xl:p-9">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-orange-300/50 bg-orange-400/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-orange-200">
                  Zaifan Student OS
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white">
                  {sessionMode === "account" ? "Secure Account" : "Legacy Access"}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("connections")}
                  className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-sky-100 transition hover:bg-sky-300/20"
                >
                  Team Bridge Live
                </button>
              </div>

              <div className="mt-7 max-w-4xl">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-300">
                  Your private student command center
                </p>
                <h1 className="mt-2 text-3xl font-black leading-[1.06] text-white sm:text-4xl lg:text-[3rem]">
                  Welcome back, {getFirstName(getStudentDisplayName(student))}.
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-white/72 sm:text-[15px]">
                  One place for your applications, documents, deadlines, counselor guidance,
                  payments and every next step in your Zaifan journey.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <HeroIdentityCard
                  label="Student Identity"
                  value={getStudentDisplayName(student)}
                  helper={"Student #" + (summary.studentId || "—")}
                />
                <HeroIdentityCard
                  label="Current Journey"
                  value={successCenter.stageLabel}
                  helper={String(journeyProgress) + "% complete"}
                />
                <HeroIdentityCard
                  label="Portal Access"
                  value={sessionMode === "account" ? "Secure Account" : "Legacy Access"}
                  helper={loadingData ? "Refreshing data" : "Portal connected"}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("actions")}
                  className="rounded-xl border-2 border-orange-500 bg-orange-500 px-5 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-sm transition hover:bg-orange-600"
                >
                  Open Action Center
                </button>

                <button
                  type="button"
                  onClick={handleDashboardRefresh}
                  disabled={loadingData}
                  className="rounded-xl border-2 border-white/20 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingData ? "Syncing..." : "Sync Portal"}
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-xl border-2 border-white/15 bg-transparent px-5 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-white/75 transition hover:border-rose-300/50 hover:bg-rose-400/10 hover:text-white"
                >
                  Sign Out
                </button>
              </div>

              {error ? (
                <div className="mt-5 rounded-xl border-2 border-orange-300/50 bg-orange-400/15 p-3 text-sm font-semibold text-orange-100">
                  {error}
                </div>
              ) : null}
            </div>

            <aside className="relative border-t-[3px] border-[#123b5d] bg-[#fff9f2] p-5 sm:p-6 lg:border-l-[3px] lg:border-t-0 xl:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-600">
                    Live Command Status
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#123b5d] sm:text-2xl">
                    Your journey right now
                  </h2>
                </div>
                <span
                  className={
                    "mt-1 h-3 w-3 shrink-0 rounded-full " +
                    (loadingData ? "animate-pulse bg-orange-500" : "bg-emerald-500")
                  }
                />
              </div>

              <div className="mt-5 rounded-[1.45rem] border-[3px] border-[#173f69] bg-[#173f69] p-5 text-white shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                      Journey Position
                    </p>
                    <p className="mt-1 text-2xl font-black">{successCenter.stageLabel}</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-right">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/55">Progress</p>
                    <p className="mt-1 text-lg font-black">{journeyProgress}%</p>
                  </div>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-orange-400"
                    style={{ width: String(clampPercent(journeyProgress)) + "%" }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <HeroCommandMini label="Health" value={String(analytics.overallHealth) + "%"} />
                  <HeroCommandMini label="Urgent" value={urgentActions + deadlineCenter.urgentCount} />
                  <HeroCommandMini label="Tasks" value={summary.pendingTasksCount || 0} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <HeroPulseTile
                  label="Documents"
                  value={String(documentReadiness) + "%"}
                  helper={String(summary.documentsCount || 0) + " visible"}
                  tone="amber"
                  onClick={() => setActiveTab("documents")}
                />
                <HeroPulseTile
                  label="Counselor"
                  value={supportAnalytics.latestResponse ? "Replied" : String(supportAnalytics.open || 0) + " open"}
                  helper={counselorCenter.counselorName}
                  tone="violet"
                  onClick={() => setActiveTab("support")}
                />
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("connections")}
                className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-sky-200 bg-sky-50 px-4 py-3 text-left transition hover:border-sky-400 hover:bg-sky-100"
              >
                <span>
                  <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-sky-700">
                    Zaifan Team Sync
                  </span>
                  <span className="mt-1 block text-[11px] font-black text-[#17324d]">
                    Admin + Counselor + Student connected
                  </span>
                </span>
                <span className="text-lg font-black text-sky-700">→</span>
              </button>
            </aside>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <StudentTopKpi
            label="Journey"
            value={String(journeyProgress) + "%"}
            helper={successCenter.stageLabel}
            tone="navy"
            onClick={() => setActiveTab("roadmap")}
          />
          <StudentTopKpi
            label="Applications"
            value={summary.applicationsCount || 0}
            helper={formatStatus(summary.applicationStatus)}
            tone="sky"
            onClick={() => setActiveTab("applications")}
          />
          <StudentTopKpi
            label="Documents"
            value={String(documentReadiness) + "%"}
            helper={String(summary.documentsCount || 0) + " visible"}
            tone="amber"
            onClick={() => setActiveTab("documents")}
          />
          <StudentTopKpi
            label="Tasks"
            value={summary.pendingTasksCount || 0}
            helper={overdueTasks.length ? String(overdueTasks.length) + " overdue" : "On track"}
            tone={overdueTasks.length ? "rose" : "orange"}
            onClick={() => setActiveTab("tasks")}
          />
          <StudentTopKpi
            label="Support"
            value={supportAnalytics.open || 0}
            helper={supportAnalytics.latestResponse ? "Counselor replied" : "Open requests"}
            tone="violet"
            onClick={() => setActiveTab("support")}
          />
          <StudentTopKpi
            label="Portal Health"
            value={String(analytics.overallHealth) + "%"}
            helper={analytics.overallHealth >= 75 ? "Healthy journey" : "Needs attention"}
            tone="green"
            onClick={() => setActiveTab("analytics")}
          />
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-[0_12px_34px_rgba(23,50,77,0.07)]">
            <div className="grid h-full md:grid-cols-[1fr_0.62fr]">
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                    Your Next Best Move
                  </span>
                  <span
                    className={
                      "rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] " +
                      (urgentActions
                        ? "border-rose-300 bg-rose-50 text-rose-700"
                        : "border-emerald-300 bg-emerald-50 text-emerald-700")
                    }
                  >
                    {urgentActions ? String(urgentActions) + " urgent" : "No urgent blockers"}
                  </span>
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-[#17324d]">
                  {actionCenterItems?.[0]?.title || "Your journey is moving"}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607487]">
                  {actionCenterItems?.[0]?.message ||
                    "There is no urgent action visible right now. Keep checking tasks, documents and counselor messages."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab(actionCenterItems?.[0]?.targetTab || "actions")}
                    className="rounded-xl border-2 border-orange-500 bg-orange-500 px-5 py-3 text-xs font-black text-white transition hover:bg-orange-600"
                  >
                    {actionCenterItems?.[0]?.action || "Open Action Center"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("counselor")}
                    className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-5 py-3 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Ask My Counselor
                  </button>
                </div>
              </div>

              <div className="border-t border-[#e8d6c2] bg-[#173f69] p-5 text-white md:border-l md:border-t-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300">
                  Live Journey Position
                </p>
                <p className="mt-2 text-2xl font-black">{successCenter.stageLabel}</p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className="text-white/65">Journey completion</span>
                    <span>{journeyProgress}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: String(clampPercent(journeyProgress)) + "%" }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/55">CAS Ready</p>
                    <p className="mt-1 text-lg font-black">{readiness.casReadiness}%</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/55">Visa Ready</p>
                    <p className="mt-1 text-lg font-black">{readiness.visaReadiness}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] p-5 shadow-[0_12px_34px_rgba(23,50,77,0.07)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">
                  Student Case Pulse
                </p>
                <h2 className="mt-2 text-xl font-black text-[#17324d]">
                  Your journey at a glance
                </h2>
              </div>
              <span
                className={
                  "mt-1 h-3 w-3 rounded-full " +
                  (loadingData ? "animate-pulse bg-orange-500" : "bg-emerald-500")
                }
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniPulse label="Offer" value={formatStatus(summary.offerStatus)} tone="navy" />
              <MiniPulse label="CAS" value={formatStatus(summary.casStatus)} tone="violet" />
              <MiniPulse label="Visa" value={formatStatus(summary.visaStatus)} tone="navy" />
              <MiniPulse
                label="Deadlines"
                value={deadlineCenter.urgentCount || 0}
                tone={deadlineCenter.urgentCount ? "rose" : "amber"}
              />
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("connections")}
              className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-sky-200 bg-sky-50 px-4 py-3 text-left transition hover:border-sky-400"
            >
              <span>
                <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-sky-700">
                  Zaifan Team Sync
                </span>
                <span className="mt-1 block text-xs font-bold text-[#17324d]">
                  Admin + Counselor + Student connected
                </span>
              </span>
              <span className="text-lg font-black text-sky-700">→</span>
            </button>
          </div>
        </section>

        <div className="sticky top-3 z-30 mt-5 mb-5">
          <nav className="rounded-[1.45rem] border-2 border-[#d8c4ad] bg-[#f7f9fb]/95 p-2.5 shadow-[0_10px_28px_rgba(23,63,105,0.06)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              {[
                ["overview", "Overview", "navy"],
                ["actions", `Action Center${urgentActions ? ` (${urgentActions})` : ""}`, "orange"],
                ["deadlines", `Deadlines${deadlineCenter.urgentCount ? ` (${deadlineCenter.urgentCount})` : ""}`, "amber"],
                ["roadmap", "Roadmap", "green"],
                ["success", "Success Center", "emerald"],
                ["counselor", "Counselor", "pink"],
                ["connections", "Zaifan Team Bridge", "sky"],
                ["support", "Support Center", "violet"],
                ["payments", "Payments", "gold"],
                ["profile", "Profile", "slate"],
                ["applications", "Applications", "cyan"],
                ["visa", "Visa", "purple"],
                ["documents", "Documents", "peach"],
                ["tasks", "Tasks", "coral"],
                ["universities", "Universities", "teal"],
                ["messages", "Messages", "rose"],
                ["timeline", "Timeline", "fuchsia"],
                ["analytics", "Analytics", "indigo"],
                ["insights", "Executive Insights", "orangeSoft"],
                ["notifications", `Notifications${notifications.length ? ` (${notifications.length})` : ""}`, "pinkSoft"],
                ["settings", "Settings", "settings"],
              ].map(([id, label, tone]) => (
                <SimpleStudentNavButton
                  key={id}
                  id={id}
                  label={label}
                  tone={tone}
                  active={activeTab === id}
                  onClick={() => setActiveTab(id)}
                />
              ))}
            </div>
          </nav>
        </div>
        <main className="mt-6 rounded-[2rem] border border-[#e8c9aa] bg-[#fffaf4]/65 p-1 shadow-[0_12px_34px_rgba(16,47,77,0.05)]">
          {activeTab === "connections" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Zaifan Team Bridge
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Your Student OS is connected to the people working on your case
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Applications, documents, tasks, support, payments and communication can flow
                      through one shared student record so Admin, Counselor and Student stay aligned.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("counselor")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      My Counselor
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("timeline")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Open Timeline
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <BridgeCommandStat
                    label="Student Identity"
                    value={summary.studentId ? `#${summary.studentId}` : "—"}
                    helper={summary.email || "Student record"}
                    tone="navy"
                  />
                  <BridgeCommandStat
                    label="Shared Records"
                    value={operationsBridge.sharedRecords || 0}
                    helper="Visible across connected workflows"
                    tone="green"
                  />
                  <BridgeCommandStat
                    label="Counselor Channel"
                    value={supportAnalytics.open || 0}
                    helper={
                      supportAnalytics.open
                        ? "Open support conversations"
                        : "No open support request"
                    }
                    tone="violet"
                  />
                  <BridgeCommandStat
                    label="Portal Sync"
                    value={loadingData ? "Syncing" : "Live"}
                    helper={
                      loadingData
                        ? "Refreshing shared records"
                        : "Student data loaded"
                    }
                    tone={loadingData ? "orange" : "green"}
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Shared Case Flow
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        How your case moves through Zaifan
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-emerald-700">
                      Connected
                    </span>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="space-y-3">
                      <BridgeFlowCard
                        step="01"
                        title="Admin Operations"
                        status="Case Management"
                        description="Applications, documents, tasks, finance and operational updates are managed against your student record."
                        tone="orange"
                        onClick={() => setActiveTab("applications")}
                      />
                      <BridgeFlowCard
                        step="02"
                        title="Counselor Guidance"
                        status={counselorCenter.counselorName || "Zaifan Counselor"}
                        description="Counselor guidance, support and communication stay tied to your actual journey context."
                        tone="violet"
                        onClick={() => setActiveTab("counselor")}
                      />
                      <BridgeFlowCard
                        step="03"
                        title="Student OS"
                        status="Your Portal"
                        description="You see portal-safe progress, tasks, documents, payments, deadlines and communication from the same case."
                        tone="navy"
                        onClick={() => setActiveTab("overview")}
                      />
                      <BridgeFlowCard
                        step="04"
                        title="Shared Timeline"
                        status={`${summary.timelineCount || 0} events`}
                        description="Important journey activity can be surfaced through your timeline so updates do not feel disconnected."
                        tone="green"
                        onClick={() => setActiveTab("timeline")}
                      />
                    </div>
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Live Connection Health
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        What is currently connected?
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        These signals are based on the Student OS data currently visible in your portal.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-5">
                      <BridgeHealthCard
                        label="Applications"
                        value={summary.applicationsCount || 0}
                        tone="orange"
                        onClick={() => setActiveTab("applications")}
                      />
                      <BridgeHealthCard
                        label="Documents"
                        value={summary.documentsCount || 0}
                        tone="amber"
                        onClick={() => setActiveTab("documents")}
                      />
                      <BridgeHealthCard
                        label="Tasks"
                        value={summary.pendingTasksCount || 0}
                        tone="rose"
                        onClick={() => setActiveTab("tasks")}
                      />
                      <BridgeHealthCard
                        label="Messages"
                        value={summary.communicationsCount || 0}
                        tone="violet"
                        onClick={() => setActiveTab("messages")}
                      />
                      <BridgeHealthCard
                        label="Payments"
                        value={summary.paymentsCount || 0}
                        tone="green"
                        onClick={() => setActiveTab("payments")}
                      />
                      <BridgeHealthCard
                        label="Timeline"
                        value={summary.timelineCount || 0}
                        tone="navy"
                        onClick={() => setActiveTab("timeline")}
                      />
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Your Side of the Bridge
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        What you can send back to Zaifan
                      </h3>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      <BridgeStudentAction
                        title="Support Requests"
                        text="Ask for help without leaving your Student OS."
                        tone="violet"
                        onClick={() => setActiveTab("support")}
                      />
                      <BridgeStudentAction
                        title="Payment Receipts"
                        text="Upload proof and keep finance records tied to your case."
                        tone="green"
                        onClick={() => setActiveTab("payments")}
                      />
                      <BridgeStudentAction
                        title="Documents"
                        text="Upload requested files into the same student record."
                        tone="amber"
                        onClick={() => setActiveTab("documents")}
                      />
                      <BridgeStudentAction
                        title="Messages"
                        text="Use communication tools when guidance or clarification is needed."
                        tone="pink"
                        onClick={() => setActiveTab("messages")}
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Operational Transparency
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      What each side contributes to your journey
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Back to Overview
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-3">
                  <BridgeRoleCard
                    title="Admin → Student"
                    eyebrow="Operations"
                    tone="orange"
                    items={[
                      "Application and offer status",
                      "Document requests and review",
                      "Tasks and operational deadlines",
                      "Finance and payment workflow",
                    ]}
                  />
                  <BridgeRoleCard
                    title="Counselor → Student"
                    eyebrow="Guidance"
                    tone="violet"
                    items={[
                      "Counselor-safe communication",
                      "Support responses",
                      "Journey guidance",
                      "Timeline and next-step context",
                    ]}
                  />
                  <BridgeRoleCard
                    title="Student → Zaifan"
                    eyebrow="Your Actions"
                    tone="green"
                    items={[
                      "Support requests",
                      "Document uploads",
                      "Payment receipt submissions",
                      "Messages and journey updates",
                    ]}
                  />
                </div>
              </section>
            </div>
          ) : null}
          {activeTab === "support" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Support Command
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Ask once. Track everything. Never lose the reply.
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Create a callback, document review, application review, visa-help or
                      general counselor request and follow every response from one place.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("counselor")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      My Counselor
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("messages")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Open Messages
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-5 lg:p-5">
                  <SupportCommandStat
                    label="Total Requests"
                    value={supportAnalytics.total || 0}
                    helper="All support requests"
                    tone="navy"
                  />
                  <SupportCommandStat
                    label="Open"
                    value={supportAnalytics.open || 0}
                    helper={
                      supportAnalytics.open
                        ? "Waiting for movement"
                        : "Nothing waiting"
                    }
                    tone={supportAnalytics.open ? "orange" : "green"}
                  />
                  <SupportCommandStat
                    label="In Progress"
                    value={supportAnalytics.inProgress || 0}
                    helper="Currently being handled"
                    tone="violet"
                  />
                  <SupportCommandStat
                    label="Responses"
                    value={supportAnalytics.responsesReceived || 0}
                    helper="Replies received"
                    tone="sky"
                  />
                  <SupportCommandStat
                    label="Resolved"
                    value={supportAnalytics.resolved || 0}
                    helper="Completed requests"
                    tone="green"
                  />
                </div>
              </section>

              {supportAnalytics.urgentOpen > 0 ? (
                <section className="rounded-[1.4rem] border-2 border-rose-300 bg-rose-50 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">
                        Priority Support Alert
                      </p>
                      <p className="mt-1 text-sm font-black text-[#17324d]">
                        {supportAnalytics.urgentOpen} high-priority request
                        {supportAnalytics.urgentOpen === 1 ? "" : "s"} still open
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#607487]">
                        Keep an eye on counselor responses and avoid creating duplicate requests for the same issue.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("timeline")}
                      className="w-fit rounded-xl border-2 border-rose-400 bg-rose-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-rose-600"
                    >
                      View Activity
                    </button>
                  </div>
                </section>
              ) : supportAnalytics.latestResponse ? (
                <section className="rounded-[1.4rem] border-2 border-emerald-300 bg-emerald-50 p-4 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
                    Latest Counselor Response
                  </p>
                  <p className="mt-1 text-sm font-black text-[#17324d]">
                    {supportAnalytics.latestResponse.subject || "Support request response"}
                  </p>
                </section>
              ) : null}

              <div className="grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                      Create Support Request
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Tell Zaifan exactly what you need
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#607487]">
                      Choose the closest request type first. This helps your counselor understand the issue faster.
                    </p>
                  </div>

                  <form onSubmit={handleSupportRequestSubmit} className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {SUPPORT_REQUEST_TYPES.map((item) => (
                        <SupportTypeCard
                          key={item.id}
                          item={item}
                          active={supportForm.requestType === item.id}
                          onClick={() => handleSupportTypeSelect(item.id)}
                        />
                      ))}
                    </div>

                    <div className="mt-5 grid gap-4">
                      <label className="block">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#607487]">
                          Subject
                        </span>
                        <input
                          value={supportForm.subject}
                          onChange={(event) =>
                            setSupportForm((prev) => ({
                              ...prev,
                              subject: event.target.value,
                            }))
                          }
                          placeholder="Example: Need help with rejected bank statement"
                          className="mt-2 w-full rounded-xl border-2 border-[#cfdbe4] bg-white px-4 py-3 text-sm font-semibold text-[#17324d] outline-none transition placeholder:text-[#9aa8b3] focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#607487]">
                          Message
                        </span>
                        <textarea
                          value={supportForm.message}
                          onChange={(event) =>
                            setSupportForm((prev) => ({
                              ...prev,
                              message: event.target.value,
                            }))
                          }
                          rows={6}
                          placeholder="Explain what happened, what you have already tried, and which application, document, university, CAS or visa item this is about."
                          className="mt-2 w-full resize-none rounded-xl border-2 border-[#cfdbe4] bg-white px-4 py-3 text-sm leading-6 text-[#17324d] outline-none transition placeholder:text-[#9aa8b3] focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        />
                      </label>
                    </div>

                    <div className="mt-4 rounded-xl border-2 border-sky-200 bg-sky-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">
                        Better request = faster help
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-[#607487]">
                        Include your exact issue, relevant university/course, document or task name,
                        and any deadline that makes the request urgent.
                      </p>
                    </div>

                    {supportSubmitStatus.message ? (
                      <div
                        className={`mt-4 rounded-xl border-2 p-3 text-sm ${
                          supportSubmitStatus.type === "success"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-orange-300 bg-orange-50 text-orange-800"
                        }`}
                      >
                        {supportSubmitStatus.message}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={supportSubmitStatus.loading}
                      className="mt-5 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        {supportSubmitStatus.loading
                          ? "Submitting Request..."
                          : "Submit Support Request"}
                      </span>
                      <span>→</span>
                    </button>
                  </form>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="flex flex-col gap-3 bg-[#173f69] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-300">
                          Support Timeline
                        </p>
                        <h3 className="mt-1 text-xl font-black">
                          Every request and response in order
                        </h3>
                      </div>

                      <span className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                        {supportAnalytics.timeline?.length || 0} events
                      </span>
                    </div>

                    <div className="p-5">
                      {supportAnalytics.timeline?.length ? (
                        <div className="space-y-3">
                          {supportAnalytics.timeline.map((event, index) => (
                            <PremiumSupportTimelineItem
                              key={event.id || `${event.created_at}-${index}`}
                              event={event}
                              index={index}
                            />
                          ))}
                        </div>
                      ) : (
                        <SupportEmptyState
                          title="No support activity yet"
                          text="Your requests and counselor responses will appear here in chronological order."
                        />
                      )}
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Quick Help Routes
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        Open the workspace connected to the issue
                      </h3>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      <SupportRouteCard
                        title="Documents"
                        text="Missing, rejected or unclear document requirements."
                        tone="amber"
                        onClick={() => setActiveTab("documents")}
                      />
                      <SupportRouteCard
                        title="Applications"
                        text="Application movement, offer status or university questions."
                        tone="orange"
                        onClick={() => setActiveTab("applications")}
                      />
                      <SupportRouteCard
                        title="Visa / CAS"
                        text="CAS preparation, visa documents or readiness questions."
                        tone="violet"
                        onClick={() => setActiveTab("visa")}
                      />
                      <SupportRouteCard
                        title="Tasks & Deadlines"
                        text="Urgent work, overdue tasks or time-sensitive next steps."
                        tone="rose"
                        onClick={() => setActiveTab("actions")}
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Request History
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Everything you have asked Zaifan for
                    </h3>
                  </div>

                  <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                    {supportRequests.length} request{supportRequests.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="p-5">
                  {supportRequests.length ? (
                    <div className="grid gap-3 xl:grid-cols-2">
                      {supportRequests.map((request, index) => (
                        <PremiumSupportHistoryCard
                          key={request.id || `${request.request_type}-${request.created_at}-${index}`}
                          request={request}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <SupportEmptyState
                      title="No support requests submitted yet"
                      text="Your first request will appear here after it is submitted."
                    />
                  )}
                </div>
              </section>
            </div>
          ) : null}
          {activeTab === "payments" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Finance Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Know what you owe, what you paid and what Zaifan is reviewing
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Invoices, payment requests, receipts and approved payment accounts stay together
                      so finance never feels disconnected from your application journey.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("support")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Payment Help
                    </button>
                    <button
                      type="button"
                      onClick={onRefresh}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Refresh Finance Data
                    </button>
                  </div>
                </div>

                {localPaymentData.loading ? (
                  <div className="border-b border-orange-200 bg-orange-50 px-5 py-3 text-sm font-bold text-orange-700">
                    Syncing latest payment records from Admin Payment Center...
                  </div>
                ) : null}

                {localPaymentData.error ? (
                  <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">
                    {localPaymentData.error}
                  </div>
                ) : null}

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <PaymentCommandStat
                    label="Invoice Total"
                    value={formatMoney(
                      totalInvoiceAmount,
                      invoices[0]?.currency || payments[0]?.currency || "PKR"
                    )}
                    helper={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"} visible`}
                    tone="navy"
                  />
                  <PaymentCommandStat
                    label="Paid"
                    value={formatMoney(
                      paidAmount,
                      payments[0]?.currency || invoices[0]?.currency || "PKR"
                    )}
                    helper={`${payments.length} payment${payments.length === 1 ? "" : "s"} recorded`}
                    tone="green"
                  />
                  <PaymentCommandStat
                    label="Outstanding"
                    value={formatMoney(
                      pendingAmount,
                      invoices[0]?.currency || payments[0]?.currency || "PKR"
                    )}
                    helper={pendingAmount > 0 ? "Still needs payment" : "Nothing outstanding"}
                    tone={pendingAmount > 0 ? "orange" : "green"}
                  />
                  <PaymentCommandStat
                    label="Overdue"
                    value={overdueInvoices.length}
                    helper={overdueInvoices.length ? "Needs attention now" : "No overdue invoice"}
                    tone={overdueInvoices.length ? "rose" : "green"}
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Invoices & Amounts Due
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        What needs payment?
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-3 p-4 sm:p-5">
                    {invoices.length ? (
                      invoices.map((invoice, index) => (
                        <PremiumInvoiceCard
                          key={invoice.id}
                          invoice={invoice}
                          index={index}
                          onUploadReceipt={() => {
                            setReceiptForm((prev) => ({
                              ...prev,
                              invoiceId: String(invoice.id),
                              amount: String(
                                invoice.total_amount ||
                                  invoice.amount ||
                                  invoice.invoice_amount ||
                                  ""
                              ),
                              currency: invoice.currency || "PKR",
                            }));
                          }}
                        />
                      ))
                    ) : (
                      <PaymentEmptyState
                        title="No invoice is visible yet"
                        text="When Zaifan creates an invoice for your student record, it will appear here with amount, status and due date."
                      />
                    )}
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Finance Snapshot
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        Your payment position
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        A simple view of billed, paid and outstanding amounts across the records currently visible.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-5">
                      <PaymentMiniStat
                        label="Total Billed"
                        value={formatMoney(totalInvoiceAmount)}
                        tone="navy"
                      />
                      <PaymentMiniStat
                        label="Total Paid"
                        value={formatMoney(paidAmount)}
                        tone="green"
                      />
                      <PaymentMiniStat
                        label="Outstanding"
                        value={formatMoney(pendingAmount)}
                        tone="orange"
                      />
                      <PaymentMiniStat
                        label="Overdue"
                        value={overdueInvoices.length}
                        tone={overdueInvoices.length ? "rose" : "green"}
                      />
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Counselor Payment Requests
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        Finance actions requested by Zaifan
                      </h3>
                    </div>

                    <div className="space-y-3 p-5">
                      {paymentRequests.length ? (
                        paymentRequests.slice(0, 5).map((request, index) => (
                          <PaymentRequestCard
                            key={request.id || `${request.created_at}-${index}`}
                            request={request}
                            index={index}
                          />
                        ))
                      ) : (
                        <PaymentEmptyState
                          compact
                          title="No payment request is waiting"
                          text="Any counselor or operations payment request linked to your case will appear here."
                        />
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-orange-300 bg-[#fffdf8] shadow-sm">
                  <div className="border-b-2 border-orange-200 bg-orange-50 px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                      Upload Payment Receipt
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Send proof directly to Zaifan
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#607487]">
                      Upload your payment proof here. The Admin Payment Center can then review it against your student record.
                    </p>
                  </div>

                  <form onSubmit={handleReceiptUploadSubmit} className="p-5">
                    {receiptUploadStatus.message ? (
                      <div
                        className={`mb-4 rounded-xl border-2 p-3 text-sm ${
                          receiptUploadStatus.type === "success"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-orange-300 bg-orange-50 text-orange-800"
                        }`}
                      >
                        {receiptUploadStatus.message}
                      </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                      <PaymentField label="Invoice">
                        <select
                          value={receiptForm.invoiceId}
                          onChange={(event) =>
                            setReceiptForm((prev) => ({
                              ...prev,
                              invoiceId: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border-2 border-[#cfdbe4] bg-white px-4 py-3 text-sm font-semibold text-[#17324d] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        >
                          <option value="">General receipt / no invoice</option>
                          {invoices.map((invoice) => (
                            <option key={invoice.id} value={invoice.id}>
                              {invoice.title || invoice.invoice_number || "Invoice"} —{" "}
                              {formatMoney(
                                invoice.total_amount || invoice.amount,
                                invoice.currency || "PKR"
                              )}
                            </option>
                          ))}
                        </select>
                      </PaymentField>

                      <PaymentField label="Amount">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={receiptForm.amount}
                          onChange={(event) =>
                            setReceiptForm((prev) => ({
                              ...prev,
                              amount: event.target.value,
                            }))
                          }
                          placeholder="Enter paid amount"
                          className="w-full rounded-xl border-2 border-[#cfdbe4] bg-white px-4 py-3 text-sm font-semibold text-[#17324d] outline-none transition placeholder:text-[#9aa8b3] focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        />
                      </PaymentField>

                      <PaymentField label="Currency">
                        <input
                          value={receiptForm.currency}
                          onChange={(event) =>
                            setReceiptForm((prev) => ({
                              ...prev,
                              currency: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border-2 border-[#cfdbe4] bg-white px-4 py-3 text-sm font-semibold text-[#17324d] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        />
                      </PaymentField>

                      <PaymentField label="Reference Number">
                        <input
                          value={receiptForm.reference}
                          onChange={(event) =>
                            setReceiptForm((prev) => ({
                              ...prev,
                              reference: event.target.value,
                            }))
                          }
                          placeholder="Transaction ID / bank reference"
                          className="w-full rounded-xl border-2 border-[#cfdbe4] bg-white px-4 py-3 text-sm font-semibold text-[#17324d] outline-none transition placeholder:text-[#9aa8b3] focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        />
                      </PaymentField>

                      <PaymentField label="Receipt File" className="md:col-span-2">
                        <label className="flex min-h-[88px] cursor-pointer items-center justify-between gap-4 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 px-4 py-4 transition hover:border-orange-500 hover:bg-orange-100">
                          <span>
                            <span className="block text-sm font-black text-[#17324d]">
                              {receiptForm.file ? receiptForm.file.name : "Choose receipt image or PDF"}
                            </span>
                            <span className="mt-1 block text-[11px] text-[#607487]">
                              Upload the clearest payment proof available.
                            </span>
                          </span>
                          <span className="rounded-xl bg-[#173f69] px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white">
                            Browse
                          </span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(event) =>
                              setReceiptForm((prev) => ({
                                ...prev,
                                file: event.target.files?.[0] || null,
                              }))
                            }
                            className="sr-only"
                          />
                        </label>
                      </PaymentField>

                      <PaymentField label="Notes / Reference" className="md:col-span-2">
                        <textarea
                          value={receiptForm.notes}
                          onChange={(event) =>
                            setReceiptForm((prev) => ({
                              ...prev,
                              notes: event.target.value,
                            }))
                          }
                          rows={4}
                          placeholder="Anything Zaifan should know about this payment..."
                          className="w-full resize-none rounded-xl border-2 border-[#cfdbe4] bg-white px-4 py-3 text-sm leading-6 text-[#17324d] outline-none transition placeholder:text-[#9aa8b3] focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        />
                      </PaymentField>
                    </div>

                    <button
                      type="submit"
                      disabled={receiptUploadStatus.loading}
                      className="mt-5 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        {receiptUploadStatus.loading
                          ? "Uploading Receipt..."
                          : "Submit Receipt for Review"}
                      </span>
                      <span>→</span>
                    </button>
                  </form>
                </section>

                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                      Approved Payment Accounts
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Where Zaifan has told you to pay
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#607487]">
                      Only use account details visible in this portal or confirmed directly by the Zaifan team.
                    </p>
                  </div>

                  <div className="space-y-3 p-5">
                    {paymentAccounts.length ? (
                      paymentAccounts.map((account, index) => (
                        <PaymentAccountCard
                          key={account.id || `${account.account_number}-${index}`}
                          account={account}
                        />
                      ))
                    ) : (
                      <PaymentEmptyState
                        title="No active payment account is visible yet"
                        text="Do not send money to an unverified account. Wait for a payment account or request to appear here, or contact Zaifan."
                      />
                    )}
                  </div>
                </section>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Payment History
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        Confirmed payment records
                      </h3>
                    </div>
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
                      {payments.length}
                    </span>
                  </div>

                  <div className="space-y-3 p-5">
                    {payments.length ? (
                      payments.map((payment, index) => (
                        <PremiumPaymentHistoryCard
                          key={payment.id || `${payment.created_at}-${index}`}
                          payment={payment}
                          index={index}
                        />
                      ))
                    ) : (
                      <PaymentEmptyState
                        compact
                        title="No confirmed payment yet"
                        text="Confirmed payment records will appear here after they are recorded by Zaifan."
                      />
                    )}
                  </div>
                </section>

                <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Receipt Review
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        Proof you submitted
                      </h3>
                    </div>
                    <span className="rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1 text-[10px] font-black text-[#173f69]">
                      {receipts.length}
                    </span>
                  </div>

                  <div className="space-y-3 p-5">
                    {receipts.length ? (
                      receipts.map((receipt, index) => (
                        <PremiumReceiptCard
                          key={receipt.id || `${receipt.created_at}-${index}`}
                          receipt={receipt}
                          index={index}
                        />
                      ))
                    ) : (
                      <PaymentEmptyState
                        compact
                        title="No receipt submitted yet"
                        text="Receipt uploads and their review status will appear here."
                      />
                    )}
                  </div>
                </section>
              </div>

              <section className="rounded-[1.6rem] border-2 border-sky-200 bg-sky-50 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                      Payment Safety
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[#17324d]">
                      Verify before you pay
                    </h3>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-[#607487]">
                      Match the account details, invoice or payment request inside Student OS.
                      Keep your transaction reference and upload the receipt after payment.
                      When anything looks different, stop and ask Zaifan before sending money.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("support")}
                    className="w-fit shrink-0 rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Ask About a Payment
                  </button>
                </div>
              </section>
            </div>
          ) : null}
          {activeTab === "overview" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffaf4] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Overview Command Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Your journey, clearly in front of you
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      See what is moving, what needs attention and exactly where your Zaifan journey stands today.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("actions")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Open Action Center
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("roadmap")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      View Journey Roadmap
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <OverviewCommandStat
                    label="Journey Progress"
                    value={`${journeyProgress}%`}
                    helper={successCenter.stageLabel}
                    tone="navy"
                    onClick={() => setActiveTab("roadmap")}
                  />
                  <OverviewCommandStat
                    label="Urgent Actions"
                    value={urgentActions + deadlineCenter.urgentCount}
                    helper={
                      urgentActions + deadlineCenter.urgentCount
                        ? "Needs your attention"
                        : "Nothing urgent"
                    }
                    tone={
                      urgentActions + deadlineCenter.urgentCount ? "rose" : "green"
                    }
                    onClick={() => setActiveTab("actions")}
                  />
                  <OverviewCommandStat
                    label="Portal Health"
                    value={`${analytics.overallHealth}%`}
                    helper={
                      analytics.overallHealth >= 75
                        ? "Journey looks healthy"
                        : "Some areas need work"
                    }
                    tone="green"
                    onClick={() => setActiveTab("analytics")}
                  />
                  <OverviewCommandStat
                    label="Counselor Support"
                    value={supportAnalytics.open || 0}
                    helper={
                      supportAnalytics.latestResponse
                        ? "New response available"
                        : "Open support requests"
                    }
                    tone="violet"
                    onClick={() => setActiveTab("support")}
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff8ef] to-[#fffdf8] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        My Student Command
                      </p>
                      <h3 className="mt-1 text-2xl font-black text-[#17324d]">
                        {summary.studentName}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-[#607487]">
                        {summary.email || "Student email not added"}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                      {sessionMode === "account" ? "Secure Portal Account" : "Legacy Student Access"}
                    </span>
                  </div>

                  <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="border-b border-[#ead9c5] p-5 lg:border-b-0 lg:border-r">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8292a0]">
                        Student Identity
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <OverviewIdentityCard
                          label="Student ID"
                          value={summary.studentId || "—"}
                          tone="navy"
                        />
                        <OverviewIdentityCard
                          label="Record Type"
                          value={formatStatus(summary.studentType)}
                          tone="orange"
                        />
                        <OverviewIdentityCard
                          label="Phone"
                          value={summary.phone || "Not added"}
                          tone="violet"
                        />
                        <OverviewIdentityCard
                          label="Current Stage"
                          value={successCenter.stageLabel}
                          tone="green"
                        />
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8292a0]">
                            Readiness Engine
                          </p>
                          <h4 className="mt-1 text-lg font-black text-[#17324d]">
                            How ready you are for the next stages
                          </h4>
                        </div>
                        <span className="rounded-full border border-[#9eb6c9] bg-[#eef4f8] px-3 py-1 text-[10px] font-black text-[#173f69]">
                          {analytics.overallHealth}% health
                        </span>
                      </div>

                      <div className="mt-5 space-y-4">
                        <PremiumReadinessRow
                          label="Application Readiness"
                          value={readiness.applicationReadiness}
                          tone="orange"
                          action={() => setActiveTab("applications")}
                        />
                        <PremiumReadinessRow
                          label="Document Readiness"
                          value={readiness.documentScore}
                          tone="amber"
                          action={() => setActiveTab("documents")}
                        />
                        <PremiumReadinessRow
                          label="CAS Readiness"
                          value={readiness.casReadiness}
                          tone="navy"
                          action={() => setActiveTab("visa")}
                        />
                        <PremiumReadinessRow
                          label="Visa Readiness"
                          value={readiness.visaReadiness}
                          tone="violet"
                          action={() => setActiveTab("visa")}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                  <div className="bg-[#173f69] p-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                          Application Pulse
                        </p>
                        <h3 className="mt-1 text-2xl font-black">
                          {latestApplication?.id
                            ? latestApplication.university_name ||
                              latestApplication.university ||
                              "Latest Application"
                            : "Your application workspace"}
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                          {latestApplication?.id
                            ? latestApplication.course_name ||
                              latestApplication.course ||
                              latestApplication.program ||
                              "Course information is not visible yet."
                            : "No application is visible yet. Zaifan can help you move from university planning to your first live application."}
                        </p>
                      </div>

                      <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.13em] text-white">
                        Live Status
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3">
                      <PremiumStageCard
                        label="Application"
                        value={formatStatus(summary.applicationStatus)}
                        tone="orange"
                      />
                      <PremiumStageCard
                        label="Offer"
                        value={formatStatus(summary.offerStatus)}
                        tone="green"
                      />
                      <PremiumStageCard
                        label="CAS"
                        value={formatStatus(summary.casStatus)}
                        tone="navy"
                      />
                      <PremiumStageCard
                        label="Visa"
                        value={formatStatus(summary.visaStatus)}
                        tone="violet"
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border-2 border-orange-200 bg-orange-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                        Next application move
                      </p>
                      <p className="mt-1 text-sm font-black text-[#17324d]">
                        {latestApplication?.id
                          ? latestApplication.next_action ||
                            latestApplication.nextAction ||
                            "Review your application workspace for the next required step."
                          : "Start your university and application plan with Zaifan."}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("applications")}
                      className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                    >
                      <span>
                        {latestApplication?.id
                          ? "Open Application Workspace"
                          : "Start My Application Plan"}
                      </span>
                      <span>→</span>
                    </button>
                  </div>
                </section>
              </div>

              <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Today&apos;s Student Priorities
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      The four areas worth checking first
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("actions")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    See All Actions
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <PremiumPriorityCard
                    eyebrow="Documents"
                    title={`${documentReadiness}% ready`}
                    text={
                      documents.length
                        ? `${documents.length} document${documents.length === 1 ? "" : "s"} visible. Keep missing, rejected or pending files moving.`
                        : "Your document workspace is ready when Zaifan requests files."
                    }
                    status={
                      documents.length
                        ? `${summary.documentsCount || documents.length} visible`
                        : "Waiting"
                    }
                    tone="amber"
                    actionLabel="Open Documents"
                    onClick={() => setActiveTab("documents")}
                  />

                  <PremiumPriorityCard
                    eyebrow="Tasks"
                    title={
                      overdueTasks.length
                        ? `${overdueTasks.length} overdue`
                        : `${summary.pendingTasksCount || 0} pending`
                    }
                    text={
                      overdueTasks.length
                        ? "Clear overdue work first so your application journey does not stall."
                        : "Your task queue shows the work assigned to your journey."
                    }
                    status={
                      overdueTasks.length ? "Needs attention" : "On track"
                    }
                    tone={overdueTasks.length ? "rose" : "orange"}
                    actionLabel="Open Tasks"
                    onClick={() => setActiveTab("tasks")}
                  />

                  <PremiumPriorityCard
                    eyebrow="My Counselor"
                    title={counselorCenter.counselorName}
                    text={
                      supportAnalytics.latestResponse
                        ? "A counselor response is available. Open your support workspace to review it."
                        : "Use Counselor, Support or Messages whenever your next step is unclear."
                    }
                    status={
                      supportAnalytics.latestResponse
                        ? "Response available"
                        : `${supportAnalytics.open || 0} open`
                    }
                    tone="violet"
                    actionLabel="Counselor Center"
                    onClick={() => setActiveTab("counselor")}
                  />

                  <PremiumPriorityCard
                    eyebrow="Deadlines"
                    title={
                      deadlineCenter.urgentCount
                        ? `${deadlineCenter.urgentCount} urgent`
                        : "Looking clear"
                    }
                    text={
                      deadlineCenter.items?.[0]?.title ||
                      "No urgent deadline is visible right now."
                    }
                    status={
                      deadlineCenter.urgentCount ? "Act now" : "No urgent date"
                    }
                    tone={deadlineCenter.urgentCount ? "rose" : "green"}
                    actionLabel="Open Deadlines"
                    onClick={() => setActiveTab("deadlines")}
                  />
                </div>
              </section>
            </div>
          ) : null}
          {activeTab === "deadlines" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Deadline Command
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Protect every important date before it becomes a blocker
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Task due dates, document dates, application deadlines, CAS timing and visa preparation
                      are combined here so you can see what needs attention first.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("actions")}
                      className="rounded-xl border border-orange-300/50 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Open Action Center
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("counselor")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Ask Counselor
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <ActionCommandStat
                    label="Total Deadlines"
                    value={deadlineCenter.items.length}
                    helper="Visible timing signals"
                    tone="navy"
                  />
                  <ActionCommandStat
                    label="Urgent"
                    value={deadlineCenter.urgentCount}
                    helper={deadlineCenter.urgentCount ? "Act on these first" : "No urgent deadline"}
                    tone={deadlineCenter.urgentCount ? "rose" : "green"}
                  />
                  <ActionCommandStat
                    label="Important"
                    value={deadlineCenter.importantCount}
                    helper={deadlineCenter.importantCount ? "Plan these next" : "No important backlog"}
                    tone="orange"
                  />
                  <ActionCommandStat
                    label="Overdue"
                    value={deadlineCenter.overdueCount}
                    helper={deadlineCenter.overdueCount ? "Recovery needed" : "Nothing overdue"}
                    tone={deadlineCenter.overdueCount ? "rose" : "green"}
                  />
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
                <div className="overflow-hidden rounded-[1.6rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                      Deadline Readiness
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Stay ahead of the next stage
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#607487]">
                      Low readiness can turn a future date into an urgent problem. Keep applications,
                      documents, tasks, CAS and visa preparation moving early.
                    </p>
                  </div>

                  <div className="space-y-4 p-5">
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
              </section>
            </div>
          ) : null}

          {activeTab === "actions" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Action Command
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Know exactly what to do next
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Tasks, documents, application gaps, university planning, CAS, visa,
                      deadlines and counselor activity are combined into one clear priority queue.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Back to Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("analytics")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      View Readiness
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <ActionCommandStat
                    label="Total Actions"
                    value={actionCenterItems.length}
                    helper={
                      actionCenterItems.length
                        ? "Your complete action queue"
                        : "Nothing waiting"
                    }
                    tone="navy"
                  />
                  <ActionCommandStat
                    label="Urgent"
                    value={urgentActions}
                    helper={urgentActions ? "Do these first" : "No urgent action"}
                    tone={urgentActions ? "rose" : "green"}
                  />
                  <ActionCommandStat
                    label="Important"
                    value={importantActions}
                    helper={
                      importantActions
                        ? "Important next steps"
                        : "No important backlog"
                    }
                    tone="orange"
                  />
                  <ActionCommandStat
                    label="Journey Health"
                    value={`${analytics.overallHealth}%`}
                    helper={
                      analytics.overallHealth >= 75
                        ? "Journey looks healthy"
                        : "Readiness needs work"
                    }
                    tone="green"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] to-[#fffaf4] p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Your First Move
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        {actionCenterItems?.[0]?.title || "Nothing urgent right now"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#607487]">
                        {actionCenterItems?.[0]?.message ||
                          "Your visible Student OS records do not currently show a required action."}
                      </p>
                    </div>

                    <div className="p-5">
                      {actionCenterItems?.[0] ? (
                        <>
                          <div className="flex flex-wrap gap-2">
                            <ActionPriorityBadge
                              priority={actionCenterItems[0].priority}
                            />
                            <span className="rounded-full border border-[#c9d6e0] bg-[#f6f9fb] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#607487]">
                              {actionCenterItems[0].source || "Student OS"}
                            </span>
                            <span className="rounded-full border border-[#d8b892] bg-[#fff7ed] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#8b633f]">
                              {formatDate(actionCenterItems[0].date)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setActiveTab(
                                actionCenterItems[0].targetTab || "overview"
                              )
                            }
                            className="mt-5 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                          >
                            <span>
                              {actionCenterItems[0].action || "Open Next Step"}
                            </span>
                            <span>→</span>
                          </button>
                        </>
                      ) : (
                        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-sm font-black text-emerald-800">
                            You&apos;re clear for now.
                          </p>
                          <p className="mt-1 text-xs leading-5 text-emerald-700/75">
                            Keep checking your portal for new counselor, document,
                            application and deadline updates.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="flex items-start justify-between gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#607487]">
                          Readiness Control
                        </p>
                        <h3 className="mt-1 text-lg font-black text-[#17324d]">
                          What is holding your journey back?
                        </h3>
                      </div>

                      <span className="rounded-full border border-[#9eb6c9] bg-[#eef4f8] px-3 py-1 text-[10px] font-black text-[#173f69]">
                        {analytics.overallHealth}% health
                      </span>
                    </div>

                    <div className="space-y-4 p-5">
                      <ActionReadinessRow
                        label="Application"
                        value={readiness.applicationReadiness}
                        tone="orange"
                        onOpen={() => setActiveTab("applications")}
                      />
                      <ActionReadinessRow
                        label="Documents"
                        value={readiness.documentScore}
                        tone="amber"
                        onOpen={() => setActiveTab("documents")}
                      />
                      <ActionReadinessRow
                        label="Tasks"
                        value={readiness.taskScore}
                        tone="rose"
                        onOpen={() => setActiveTab("tasks")}
                      />
                      <ActionReadinessRow
                        label="CAS"
                        value={readiness.casReadiness}
                        tone="navy"
                        onOpen={() => setActiveTab("visa")}
                      />
                      <ActionReadinessRow
                        label="Visa"
                        value={readiness.visaReadiness}
                        tone="violet"
                        onOpen={() => setActiveTab("visa")}
                      />
                    </div>
                  </section>
                </div>

                <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#173f69] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-300">
                        Priority Queue
                      </p>
                      <h3 className="mt-1 text-xl font-black">
                        Your Student OS action list
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-white">
                      {actionCenterItems.length} total
                    </span>
                  </div>

                  <div className="space-y-3 p-4 sm:p-5">
                    {actionCenterItems.length ? (
                      actionCenterItems.map((item, index) => (
                        <PremiumActionQueueItem
                          key={item.id}
                          item={item}
                          index={index}
                          onOpen={() =>
                            setActiveTab(item.targetTab || "overview")
                          }
                        />
                      ))
                    ) : (
                      <div className="rounded-[1.4rem] border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
                        <p className="text-lg font-black text-emerald-800">
                          Your action queue is clear.
                        </p>
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-emerald-700/75">
                          No task, document, application, university, CAS, visa or
                          communication action is currently required.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ActionShortcutCard
                  eyebrow="Tasks"
                  title={`${summary.pendingTasksCount || 0} pending`}
                  text={
                    overdueTasks.length
                      ? `${overdueTasks.length} task${overdueTasks.length === 1 ? "" : "s"} overdue. Clear these before they slow your journey.`
                      : "Review the tasks currently assigned to your Student OS."
                  }
                  tone={overdueTasks.length ? "rose" : "orange"}
                  onClick={() => setActiveTab("tasks")}
                />

                <ActionShortcutCard
                  eyebrow="Documents"
                  title={`${readiness.documentScore}% ready`}
                  text={
                    documents.length
                      ? `${documents.length} document${documents.length === 1 ? "" : "s"} visible in your document workspace.`
                      : "No documents are visible yet. Your workspace is ready when files are requested."
                  }
                  tone="amber"
                  onClick={() => setActiveTab("documents")}
                />

                <ActionShortcutCard
                  eyebrow="Applications"
                  title={formatStatus(summary.applicationStatus)}
                  text={
                    latestApplication?.id
                      ? "Open the live application workspace and check its next required movement."
                      : "No application is visible yet. Begin with university and application planning."
                  }
                  tone="green"
                  onClick={() => setActiveTab("applications")}
                />

                <ActionShortcutCard
                  eyebrow="Counselor"
                  title={
                    supportAnalytics.latestResponse
                      ? "Response available"
                      : `${supportAnalytics.open || 0} support open`
                  }
                  text="When a next step is unclear, open your Counselor or Support workspace instead of guessing."
                  tone="violet"
                  onClick={() => setActiveTab("counselor")}
                />
              </section>
            </div>
          ) : null}
          {activeTab === "roadmap" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Journey Roadmap
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      See the whole journey without feeling lost
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Your roadmap turns applications, offers, documents, CAS, visa,
                      counselor guidance and tasks into one simple study-abroad journey.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("actions")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Open Action Center
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("deadlines")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Check Deadlines
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <RoadmapCommandStat
                    label="Journey Progress"
                    value={`${journeyProgress}%`}
                    helper={successCenter.stageLabel}
                    tone="navy"
                  />
                  <RoadmapCommandStat
                    label="Application"
                    value={formatStatus(summary.applicationStatus)}
                    helper="Current application stage"
                    tone="orange"
                  />
                  <RoadmapCommandStat
                    label="CAS Readiness"
                    value={`${readiness.casReadiness}%`}
                    helper="Ready for CAS movement"
                    tone="green"
                  />
                  <RoadmapCommandStat
                    label="Visa Readiness"
                    value={`${readiness.visaReadiness}%`}
                    helper="Visa preparation health"
                    tone="violet"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Your Journey Path
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        From planning to arrival
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#eef4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {journeyProgress}% complete
                    </span>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="space-y-3">
                      <RoadmapStageCard
                        step="01"
                        title="Profile & Planning"
                        status={
                          summary.studentId ? "Completed" : "In Progress"
                        }
                        description="Your Student OS identity, profile and initial planning foundation."
                        tone="navy"
                        active={!summary.studentId}
                        complete={Boolean(summary.studentId)}
                        onClick={() => setActiveTab("profile")}
                      />

                      <RoadmapStageCard
                        step="02"
                        title="University Shortlist"
                        status={
                          summary.universitiesCount
                            ? `${summary.universitiesCount} visible`
                            : "Not Started"
                        }
                        description="Build and refine the university plan before applications begin."
                        tone="teal"
                        active={!summary.applicationsCount && Boolean(summary.universitiesCount)}
                        complete={Boolean(summary.universitiesCount)}
                        onClick={() => setActiveTab("universities")}
                      />

                      <RoadmapStageCard
                        step="03"
                        title="Applications"
                        status={formatStatus(summary.applicationStatus)}
                        description="Track submissions, review, offers and every application movement."
                        tone="orange"
                        active={
                          summary.applicationsCount > 0 &&
                          !["offer_received", "offer_accepted", "enrolled"].includes(
                            String(summary.applicationStatus || "").toLowerCase()
                          )
                        }
                        complete={[
                          "offer_received",
                          "offer_accepted",
                          "enrolled",
                        ].includes(
                          String(summary.applicationStatus || "").toLowerCase()
                        )}
                        onClick={() => setActiveTab("applications")}
                      />

                      <RoadmapStageCard
                        step="04"
                        title="Documents"
                        status={`${readiness.documentScore}% ready`}
                        description="Keep required, missing, rejected and approved files moving."
                        tone="amber"
                        active={
                          readiness.documentScore > 0 &&
                          readiness.documentScore < 100
                        }
                        complete={readiness.documentScore >= 100}
                        onClick={() => setActiveTab("documents")}
                      />

                      <RoadmapStageCard
                        step="05"
                        title="Offer & Decision"
                        status={formatStatus(summary.offerStatus)}
                        description="Understand your offer stage and what needs to happen before CAS."
                        tone="green"
                        active={[
                          "offer_received",
                          "offer_accepted",
                        ].includes(String(summary.offerStatus || "").toLowerCase())}
                        complete={
                          String(summary.offerStatus || "").toLowerCase() ===
                          "offer_accepted"
                        }
                        onClick={() => setActiveTab("applications")}
                      />

                      <RoadmapStageCard
                        step="06"
                        title="CAS"
                        status={formatStatus(summary.casStatus)}
                        description="Prepare the financial, document and university requirements needed for CAS."
                        tone="navy"
                        active={
                          String(summary.offerStatus || "").toLowerCase() ===
                            "offer_accepted" &&
                          String(summary.casStatus || "").toLowerCase() !==
                            "cas_issued"
                        }
                        complete={
                          String(summary.casStatus || "").toLowerCase() ===
                          "cas_issued"
                        }
                        onClick={() => setActiveTab("visa")}
                      />

                      <RoadmapStageCard
                        step="07"
                        title="Visa"
                        status={formatStatus(summary.visaStatus)}
                        description="Follow visa preparation, submission, review and final decision."
                        tone="violet"
                        active={
                          String(summary.casStatus || "").toLowerCase() ===
                            "cas_issued" &&
                          String(summary.visaStatus || "").toLowerCase() !==
                            "visa_approved"
                        }
                        complete={
                          String(summary.visaStatus || "").toLowerCase() ===
                          "visa_approved"
                        }
                        onClick={() => setActiveTab("visa")}
                      />

                      <RoadmapStageCard
                        step="08"
                        title="Ready to Fly"
                        status={
                          String(summary.visaStatus || "").toLowerCase() ===
                          "visa_approved"
                            ? "Ready"
                            : "Locked"
                        }
                        description="Final travel preparation becomes active after your visa is approved."
                        tone="rose"
                        active={
                          String(summary.visaStatus || "").toLowerCase() ===
                          "visa_approved"
                        }
                        complete={
                          String(summary.applicationStatus || "").toLowerCase() ===
                          "enrolled"
                        }
                        onClick={() => setActiveTab("success")}
                      />
                    </div>
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Current Position
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {successCenter.stageLabel}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        This is where your journey currently sits based on visible Student OS data.
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black text-[#607487]">
                          Journey completion
                        </p>
                        <p className="text-sm font-black text-[#17324d]">
                          {journeyProgress}%
                        </p>
                      </div>

                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#edf1f4]">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: String(journeyProgress) + "%" }}
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <RoadmapMiniStat
                          label="Documents"
                          value={`${readiness.documentScore}%`}
                          tone="amber"
                        />
                        <RoadmapMiniStat
                          label="CAS"
                          value={`${readiness.casReadiness}%`}
                          tone="navy"
                        />
                        <RoadmapMiniStat
                          label="Visa"
                          value={`${readiness.visaReadiness}%`}
                          tone="violet"
                        />
                        <RoadmapMiniStat
                          label="Health"
                          value={`${analytics.overallHealth}%`}
                          tone="green"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Next Milestone
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        What should happen next?
                      </h3>
                    </div>

                    <div className="p-5">
                      <p className="text-lg font-black text-[#17324d]">
                        {actionCenterItems?.[0]?.title ||
                          "Keep your current journey moving"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#607487]">
                        {actionCenterItems?.[0]?.message ||
                          "There is no urgent blocker visible right now. Continue monitoring your tasks, documents and counselor updates."}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            actionCenterItems?.[0]?.targetTab || "actions"
                          )
                        }
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>
                          {actionCenterItems?.[0]?.action || "Open Action Center"}
                        </span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#607487]">
                      Journey Support
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[#17324d]">
                      Never guess your next step
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#607487]">
                      Open your counselor or support workspace whenever a roadmap step is unclear.
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("counselor")}
                        className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-xs font-black text-white transition hover:bg-[#214e78]"
                      >
                        My Counselor
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("support")}
                        className="rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-3 text-xs font-black text-violet-800 transition hover:bg-violet-100"
                      >
                        Support Center
                      </button>
                    </div>
                  </section>
                </div>
              </div>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <RoadmapShortcutCard
                  eyebrow="Universities"
                  title={`${summary.universitiesCount || 0} visible`}
                  text="Build the plan before applications so your journey starts with the right options."
                  tone="teal"
                  onClick={() => setActiveTab("universities")}
                />
                <RoadmapShortcutCard
                  eyebrow="Documents"
                  title={`${readiness.documentScore}% ready`}
                  text="Document readiness protects application, CAS and visa progress."
                  tone="amber"
                  onClick={() => setActiveTab("documents")}
                />
                <RoadmapShortcutCard
                  eyebrow="Tasks"
                  title={`${summary.pendingTasksCount || 0} pending`}
                  text="Tasks are the daily actions that move your roadmap from one stage to the next."
                  tone="orange"
                  onClick={() => setActiveTab("tasks")}
                />
                <RoadmapShortcutCard
                  eyebrow="Counselor"
                  title={counselorCenter.counselorName}
                  text="Use guidance whenever you are unsure what a roadmap stage means or requires."
                  tone="violet"
                  onClick={() => setActiveTab("counselor")}
                />
              </section>
            </div>
          ) : null}
          {activeTab === "success" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Success Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Turn progress into your next milestone
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      See your current stage, journey health, readiness, achievements and
                      the exact next move that will push your study-abroad journey forward.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("roadmap")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      View Roadmap
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("actions")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Open Action Center
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <SuccessCommandStat
                    label="Current Stage"
                    value={successCenter.stageLabel}
                    helper="Where your journey stands"
                    tone="navy"
                  />
                  <SuccessCommandStat
                    label="Journey Progress"
                    value={`${journeyProgress}%`}
                    helper="Overall milestone completion"
                    tone="orange"
                  />
                  <SuccessCommandStat
                    label="Portal Health"
                    value={`${analytics.overallHealth}%`}
                    helper={
                      analytics.overallHealth >= 75
                        ? "Healthy momentum"
                        : "Needs improvement"
                    }
                    tone="green"
                  />
                  <SuccessCommandStat
                    label="Urgent Actions"
                    value={urgentActions + deadlineCenter.urgentCount}
                    helper={
                      urgentActions + deadlineCenter.urgentCount
                        ? "Resolve these first"
                        : "No urgent blockers"
                    }
                    tone={
                      urgentActions + deadlineCenter.urgentCount
                        ? "rose"
                        : "green"
                    }
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Success Journey
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        Your milestone ladder
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#eef4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {journeyProgress}% complete
                    </span>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="grid gap-3 md:grid-cols-2">
                      <SuccessMilestoneCard
                        title="Student Profile Ready"
                        value={summary.studentId ? "Complete" : "Pending"}
                        description="Your identity and Student OS record are the foundation of every next step."
                        tone="navy"
                        complete={Boolean(summary.studentId)}
                        onClick={() => setActiveTab("profile")}
                      />

                      <SuccessMilestoneCard
                        title="University Plan"
                        value={
                          summary.universitiesCount
                            ? `${summary.universitiesCount} visible`
                            : "Not Started"
                        }
                        description="A focused university plan makes the application journey faster and clearer."
                        tone="teal"
                        complete={Boolean(summary.universitiesCount)}
                        onClick={() => setActiveTab("universities")}
                      />

                      <SuccessMilestoneCard
                        title="Application Progress"
                        value={formatStatus(summary.applicationStatus)}
                        description="Track movement from planning and submission through offer decisions."
                        tone="orange"
                        complete={[
                          "offer_received",
                          "offer_accepted",
                          "enrolled",
                        ].includes(
                          String(summary.applicationStatus || "").toLowerCase()
                        )}
                        onClick={() => setActiveTab("applications")}
                      />

                      <SuccessMilestoneCard
                        title="Document Readiness"
                        value={`${readiness.documentScore}%`}
                        description="Strong documents protect application, CAS and visa timelines."
                        tone="amber"
                        complete={readiness.documentScore >= 100}
                        onClick={() => setActiveTab("documents")}
                      />

                      <SuccessMilestoneCard
                        title="CAS Progress"
                        value={formatStatus(summary.casStatus)}
                        description="CAS readiness depends on offer, documents and financial preparation."
                        tone="navy"
                        complete={
                          String(summary.casStatus || "").toLowerCase() ===
                          "cas_issued"
                        }
                        onClick={() => setActiveTab("visa")}
                      />

                      <SuccessMilestoneCard
                        title="Visa Progress"
                        value={formatStatus(summary.visaStatus)}
                        description="Visa approval is the final major milestone before travel preparation."
                        tone="violet"
                        complete={
                          String(summary.visaStatus || "").toLowerCase() ===
                          "visa_approved"
                        }
                        onClick={() => setActiveTab("visa")}
                      />
                    </div>
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Best Next Step
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {actionCenterItems?.[0]?.title ||
                          "Keep your journey moving"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {actionCenterItems?.[0]?.message ||
                          "There is no urgent blocker visible right now. Continue monitoring your tasks, documents and counselor updates."}
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <SuccessMiniStat
                          label="Applications"
                          value={`${readiness.applicationReadiness}%`}
                          tone="orange"
                        />
                        <SuccessMiniStat
                          label="Documents"
                          value={`${readiness.documentScore}%`}
                          tone="amber"
                        />
                        <SuccessMiniStat
                          label="CAS"
                          value={`${readiness.casReadiness}%`}
                          tone="navy"
                        />
                        <SuccessMiniStat
                          label="Visa"
                          value={`${readiness.visaReadiness}%`}
                          tone="violet"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            actionCenterItems?.[0]?.targetTab || "actions"
                          )
                        }
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>
                          {actionCenterItems?.[0]?.action ||
                            "Open Action Center"}
                        </span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Success Intelligence
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        What is helping or slowing your journey?
                      </h3>
                    </div>

                    <div className="space-y-3 p-5">
                      <SuccessInsightRow
                        label="Applications"
                        value={readiness.applicationReadiness}
                        text={
                          readiness.applicationReadiness >= 75
                            ? "Application readiness is strong."
                            : "Application planning needs more attention."
                        }
                        tone="orange"
                        onClick={() => setActiveTab("applications")}
                      />

                      <SuccessInsightRow
                        label="Documents"
                        value={readiness.documentScore}
                        text={
                          readiness.documentScore >= 75
                            ? "Document readiness is supporting your journey."
                            : "Missing or incomplete files may slow progress."
                        }
                        tone="amber"
                        onClick={() => setActiveTab("documents")}
                      />

                      <SuccessInsightRow
                        label="CAS"
                        value={readiness.casReadiness}
                        text={
                          readiness.casReadiness >= 75
                            ? "CAS preparation is moving well."
                            : "Offer, documents or finance may still block CAS."
                        }
                        tone="navy"
                        onClick={() => setActiveTab("visa")}
                      />

                      <SuccessInsightRow
                        label="Visa"
                        value={readiness.visaReadiness}
                        text={
                          readiness.visaReadiness >= 75
                            ? "Visa readiness is in a healthy range."
                            : "Visa preparation still needs attention."
                        }
                        tone="violet"
                        onClick={() => setActiveTab("visa")}
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Smart Guidance
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Focus on the moves that improve your success fastest
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("actions")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Open Action Center
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <SuccessGuidanceCard
                    eyebrow="Action Focus"
                    title={
                      urgentActions
                        ? `${urgentActions} urgent action${urgentActions === 1 ? "" : "s"}`
                        : "Action queue clear"
                    }
                    text={
                      urgentActions
                        ? "Complete urgent work first so other journey stages can keep moving."
                        : "No urgent Student OS action is currently blocking your progress."
                    }
                    tone={urgentActions ? "rose" : "green"}
                    actionLabel="Open Actions"
                    onClick={() => setActiveTab("actions")}
                  />

                  <SuccessGuidanceCard
                    eyebrow="Documents"
                    title={`${readiness.documentScore}% ready`}
                    text="Document readiness affects applications, CAS, visa timing and overall portal health."
                    tone="amber"
                    actionLabel="Open Documents"
                    onClick={() => setActiveTab("documents")}
                  />

                  <SuccessGuidanceCard
                    eyebrow="Application"
                    title={formatStatus(summary.applicationStatus)}
                    text="Your application stage is one of the biggest signals of where the journey should move next."
                    tone="orange"
                    actionLabel="Open Applications"
                    onClick={() => setActiveTab("applications")}
                  />

                  <SuccessGuidanceCard
                    eyebrow="Counselor"
                    title={counselorCenter.counselorName}
                    text="Use guidance whenever the next milestone is unclear instead of guessing your way forward."
                    tone="violet"
                    actionLabel="My Counselor"
                    onClick={() => setActiveTab("counselor")}
                  />
                </div>
              </section>
            </div>
          ) : null}
          {activeTab === "counselor" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Counselor Guidance Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Your counselor should feel one click away
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Get guidance for applications, documents, offers, CAS, visa, deadlines,
                      tasks and anything else that feels unclear in your Student OS journey.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("messages")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Open Messages
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("support")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Open Support
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <CounselorCommandStat
                    label="Assigned Counselor"
                    value={counselorCenter.counselorName || "Zaifan Counselor"}
                    helper="Your primary guidance contact"
                    tone="navy"
                  />
                  <CounselorCommandStat
                    label="Support Open"
                    value={supportAnalytics.open || 0}
                    helper={
                      supportAnalytics.open
                        ? "Requests awaiting resolution"
                        : "No open support request"
                    }
                    tone={supportAnalytics.open ? "violet" : "green"}
                  />
                  <CounselorCommandStat
                    label="Messages"
                    value={summary.communicationsCount || 0}
                    helper="Visible communication records"
                    tone="pink"
                  />
                  <CounselorCommandStat
                    label="Urgent Journey Items"
                    value={urgentActions + deadlineCenter.urgentCount}
                    helper={
                      urgentActions + deadlineCenter.urgentCount
                        ? "Good reason to ask for guidance"
                        : "No urgent blocker"
                    }
                    tone={
                      urgentActions + deadlineCenter.urgentCount
                        ? "rose"
                        : "green"
                    }
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                  <div className="bg-[#173f69] p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                      My Counselor
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      {counselorCenter.counselorName || "Zaifan Counselor"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Your counselor is connected to the same journey areas you see here,
                      so guidance can stay tied to your real applications, documents, tasks and deadlines.
                    </p>
                  </div>

                  <div className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CounselorInfoCard
                        label="Counselor Email"
                        value={
                          counselorCenter.counselorEmail ||
                          counselorCenter.email ||
                          "Use Messages / Support"
                        }
                        tone="sky"
                      />
                      <CounselorInfoCard
                        label="Phone / WhatsApp"
                        value={
                          counselorCenter.counselorPhone ||
                          counselorCenter.phone ||
                          "Ask Zaifan team"
                        }
                        tone="green"
                      />
                      <CounselorInfoCard
                        label="Student Email"
                        value={summary.email || "Not added"}
                        tone="orange"
                      />
                      <CounselorInfoCard
                        label="Student ID"
                        value={summary.studentId || "—"}
                        tone="navy"
                      />
                    </div>

                    <div className="mt-4 rounded-[1.35rem] border-2 border-orange-200 bg-orange-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                        Best way to get a useful answer
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#607487]">
                        Mention the exact application, document, task, university, deadline,
                        CAS or visa issue you need help with. Your Student ID and portal context
                        help the Zaifan team understand the case faster.
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab("messages")}
                        className="flex items-center justify-between rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3.5 text-sm font-black text-white transition hover:bg-[#214e78]"
                      >
                        <span>Open Messages</span>
                        <span>→</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("support")}
                        className="flex items-center justify-between rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-3.5 text-sm font-black text-violet-800 transition hover:bg-violet-100"
                      >
                        <span>Open Support Center</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                          Ask Your Counselor About
                        </p>
                        <h3 className="mt-1 text-xl font-black text-[#17324d]">
                          Guidance connected to your real journey
                        </h3>
                      </div>

                      <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#eef4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                        {successCenter.stageLabel}
                      </span>
                    </div>

                    <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-2">
                      <CounselorGuidanceCard
                        eyebrow="Applications"
                        title={formatStatus(summary.applicationStatus)}
                        text="Ask about university submission, application movement, offers and the next decision."
                        tone="orange"
                        onClick={() => setActiveTab("applications")}
                      />
                      <CounselorGuidanceCard
                        eyebrow="Documents"
                        title={`${readiness.documentScore}% ready`}
                        text="Get help with missing, rejected, unclear or time-sensitive document requirements."
                        tone="amber"
                        onClick={() => setActiveTab("documents")}
                      />
                      <CounselorGuidanceCard
                        eyebrow="CAS / Visa"
                        title={`${Math.min(readiness.casReadiness, readiness.visaReadiness)}% minimum`}
                        text="Ask what is still needed for CAS or visa and what should be prepared first."
                        tone="violet"
                        onClick={() => setActiveTab("visa")}
                      />
                      <CounselorGuidanceCard
                        eyebrow="Deadlines"
                        title={
                          deadlineCenter.urgentCount
                            ? `${deadlineCenter.urgentCount} urgent`
                            : "No urgent deadline"
                        }
                        text="Use counselor guidance when timing is tight or the correct next move is unclear."
                        tone={deadlineCenter.urgentCount ? "rose" : "green"}
                        onClick={() => setActiveTab("deadlines")}
                      />
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#607487]">
                        Counselor Response Center
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        What&apos;s happening with your support?
                      </h3>
                    </div>

                    <div className="p-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <CounselorResponseStat
                          label="Open Requests"
                          value={supportAnalytics.open || 0}
                          tone={supportAnalytics.open ? "violet" : "green"}
                        />
                        <CounselorResponseStat
                          label="Latest Response"
                          value={
                            supportAnalytics.latestResponse
                              ? "Available"
                              : "No new reply"
                          }
                          tone={
                            supportAnalytics.latestResponse
                              ? "green"
                              : "navy"
                          }
                        />
                      </div>

                      <div className="mt-4 rounded-[1.35rem] border-2 border-[#dbe5ec] bg-[#f8fbfd] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#607487]">
                          Where counselor updates appear
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#607487]">
                          Counselor replies and communication history appear inside Messages,
                          Support and Timeline when they are connected to your student record.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab("timeline")}
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-[#9eb6c9] bg-[#edf4f8] px-4 py-3 text-sm font-black text-[#173f69] transition hover:border-orange-400 hover:bg-orange-50"
                      >
                        <span>Open Communication Timeline</span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      When Should I Contact My Counselor?
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Use guidance when it saves time, stress or mistakes
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("support")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Ask Zaifan
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <CounselorReasonCard
                    number="01"
                    title="A document is rejected"
                    text="Ask what must change before uploading again instead of guessing."
                    tone="rose"
                  />
                  <CounselorReasonCard
                    number="02"
                    title="A deadline is close"
                    text="Confirm the safest next move when timing is tight."
                    tone="orange"
                  />
                  <CounselorReasonCard
                    number="03"
                    title="An offer or CAS is unclear"
                    text="Get help understanding conditions, acceptance or CAS preparation."
                    tone="navy"
                  />
                  <CounselorReasonCard
                    number="04"
                    title="Visa preparation is confusing"
                    text="Ask what is missing and which requirement should be handled first."
                    tone="violet"
                  />
                </div>
              </section>
            </div>
          ) : null}
          
          {activeTab === "profile" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Identity Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Your profile is the foundation of your whole Student OS
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Review your identity, portal access, study direction and journey status in one place.
                      This information helps Zaifan keep applications, documents and counselor work tied to the correct student record.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Account Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("roadmap")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      View Journey
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <ProfileCommandStat
                    label="Student ID"
                    value={summary.studentId ? `#${summary.studentId}` : "—"}
                    helper="Your Zaifan record identity"
                    tone="navy"
                  />
                  <ProfileCommandStat
                    label="Portal Access"
                    value={account?.is_active === false ? "Inactive" : "Active"}
                    helper={sessionMode === "account" ? "Secure account login" : "Legacy lookup session"}
                    tone={account?.is_active === false ? "rose" : "green"}
                  />
                  <ProfileCommandStat
                    label="Journey Stage"
                    value={successCenter.stageLabel}
                    helper={`${journeyProgress}% journey complete`}
                    tone="orange"
                  />
                  <ProfileCommandStat
                    label="Portal Health"
                    value={`${analytics.overallHealth}%`}
                    helper={analytics.overallHealth >= 75 ? "Profile and journey look healthy" : "Some areas need attention"}
                    tone={analytics.overallHealth >= 75 ? "green" : "violet"}
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                  <div className="bg-[#173f69] p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                      My Student Identity
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      {summary.studentName || "Zaifan Student"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      Your core contact and student-record information.
                    </p>
                  </div>

                  <div className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ProfileIdentityCard label="Full Name" value={summary.studentName || "Not added"} tone="navy" />
                      <ProfileIdentityCard label="Email" value={summary.email || "Not added"} tone="sky" />
                      <ProfileIdentityCard label="Phone" value={summary.phone || "Not added"} tone="violet" />
                      <ProfileIdentityCard label="Student ID" value={summary.studentId || "Not available"} tone="orange" />
                      <ProfileIdentityCard label="Student Type" value={formatStatus(summary.studentType)} tone="green" />
                      <ProfileIdentityCard label="Portal Email" value={account?.email || "Not connected"} tone="amber" />
                    </div>

                    <div className="mt-4 rounded-[1.35rem] border-2 border-orange-200 bg-orange-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-700">
                        Why this matters
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#607487]">
                        Zaifan uses this identity to keep your portal, counselor communication,
                        documents, tasks, applications and payments connected to the same student record.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Study Direction
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        What your current record says about your plans
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {formatStatus(summary.studentType)}
                    </span>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <ProfileStudyCard
                      label="Country"
                      value={
                        student?.country ||
                        student?.country_interest ||
                        student?.preferred_country ||
                        "Not added"
                      }
                      helper="Current destination connected to your student record"
                      tone="orange"
                    />
                    <ProfileStudyCard
                      label="Study Interest"
                      value={
                        student?.field_of_interest ||
                        student?.course ||
                        student?.program ||
                        student?.consultation_type ||
                        "Not added"
                      }
                      helper="Your current course, field or consultation focus"
                      tone="teal"
                    />
                    <ProfileStudyCard
                      label="Record Source"
                      value={formatStatus(summary.studentType)}
                      helper="Where this Student OS record originated"
                      tone="navy"
                    />
                    <ProfileStudyCard
                      label="Profile Created"
                      value={formatDate(student?.created_at || student?.appointment_date)}
                      helper="When this student record entered Zaifan"
                      tone="violet"
                    />
                  </div>
                </section>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Journey Status
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Your major study-abroad stages
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("roadmap")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Open Roadmap
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <ProfileJourneyCard
                    step="01"
                    label="Application"
                    value={formatStatus(summary.applicationStatus)}
                    helper={`${readiness.applicationReadiness}% ready`}
                    tone="orange"
                    onClick={() => setActiveTab("applications")}
                  />
                  <ProfileJourneyCard
                    step="02"
                    label="Offer"
                    value={formatStatus(summary.offerStatus)}
                    helper="University decision stage"
                    tone="green"
                    onClick={() => setActiveTab("applications")}
                  />
                  <ProfileJourneyCard
                    step="03"
                    label="CAS"
                    value={formatStatus(summary.casStatus)}
                    helper={`${readiness.casReadiness}% ready`}
                    tone="navy"
                    onClick={() => setActiveTab("visa")}
                  />
                  <ProfileJourneyCard
                    step="04"
                    label="Visa"
                    value={formatStatus(summary.visaStatus)}
                    helper={`${readiness.visaReadiness}% ready`}
                    tone="violet"
                    onClick={() => setActiveTab("visa")}
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Student OS Activity
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      What is connected to your profile
                    </h3>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
                    <ProfileActivityCard
                      label="Documents"
                      value={summary.documentsCount || 0}
                      helper={`${readiness.documentScore}% ready`}
                      tone="amber"
                      onClick={() => setActiveTab("documents")}
                    />
                    <ProfileActivityCard
                      label="Tasks"
                      value={summary.tasksCount || 0}
                      helper={`${summary.pendingTasksCount || 0} pending`}
                      tone="orange"
                      onClick={() => setActiveTab("tasks")}
                    />
                    <ProfileActivityCard
                      label="Universities"
                      value={summary.universitiesCount || 0}
                      helper="Visible options"
                      tone="teal"
                      onClick={() => setActiveTab("universities")}
                    />
                    <ProfileActivityCard
                      label="Messages"
                      value={summary.communicationsCount || 0}
                      helper="Communication records"
                      tone="pink"
                      onClick={() => setActiveTab("messages")}
                    />
                    <ProfileActivityCard
                      label="Timeline"
                      value={summary.timelineCount || 0}
                      helper="Journey events"
                      tone="navy"
                      onClick={() => setActiveTab("timeline")}
                    />
                    <ProfileActivityCard
                      label="Payments"
                      value={summary.paymentsCount || 0}
                      helper="Finance records"
                      tone="green"
                      onClick={() => setActiveTab("payments")}
                    />
                  </div>
                </section>

                <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                  <div className="bg-[#173f69] p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                      Portal Access
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      Your account connection
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      See how you are signed in and whether your Student OS account is active.
                    </p>
                  </div>

                  <div className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ProfileAccessCard
                        label="Portal Account"
                        value={account?.is_active === false ? "Inactive" : "Active"}
                        tone={account?.is_active === false ? "rose" : "green"}
                      />
                      <ProfileAccessCard
                        label="Login Mode"
                        value={sessionMode === "account" ? "Account Login" : "Legacy Lookup"}
                        tone="navy"
                      />
                      <ProfileAccessCard
                        label="Portal Email"
                        value={account?.email || "Not connected"}
                        tone="sky"
                      />
                      <ProfileAccessCard
                        label="Record Source"
                        value={formatStatus(summary.studentType)}
                        tone="orange"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                    >
                      <span>Open Account Settings</span>
                      <span>→</span>
                    </button>
                  </div>
                </section>
              </div>

              <section className="rounded-[1.6rem] border-2 border-sky-200 bg-sky-50 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                      Something Looks Wrong?
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[#17324d]">
                      Don&apos;t ignore incorrect profile information
                    </h3>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-[#607487]">
                      If your name, phone, destination, study interest or account information is incorrect,
                      contact Zaifan so the source student record can be corrected rather than creating a second profile.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("support")}
                    className="w-fit shrink-0 rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Report Profile Issue
                  </button>
                </div>
              </section>
            </div>
          ) : null}
          {activeTab === "applications" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Application Command Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Follow every application from plan to decision
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      University, course, application status, offer, CAS and visa progress stay connected
                      so you always know what has moved and what needs to happen next.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("universities")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Universities
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("counselor")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Ask My Counselor
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <ApplicationCommandStat
                    label="Applications"
                    value={applications.length}
                    helper={applications.length ? "Visible application records" : "No application started"}
                    tone="navy"
                  />
                  <ApplicationCommandStat
                    label="Application Readiness"
                    value={`${readiness.applicationReadiness}%`}
                    helper={
                      readiness.applicationReadiness >= 75
                        ? "Ready for strong movement"
                        : "Preparation still needed"
                    }
                    tone="orange"
                  />
                  <ApplicationCommandStat
                    label="Offer Stage"
                    value={formatStatus(summary.offerStatus)}
                    helper="Latest visible offer status"
                    tone="green"
                  />
                  <ApplicationCommandStat
                    label="CAS / Visa"
                    value={`${Math.min(readiness.casReadiness, readiness.visaReadiness)}%`}
                    helper="Minimum downstream readiness"
                    tone="violet"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        My Applications
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        Every university application in one place
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {applications.length} record{applications.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    {applications.length ? (
                      applications.map((application, index) => (
                        <PremiumStudentApplicationCard
                          key={application.id || `${application.university_name}-${index}`}
                          application={application}
                          index={index}
                          onDocuments={() => setActiveTab("documents")}
                          onVisa={() => setActiveTab("visa")}
                          onCounselor={() => setActiveTab("counselor")}
                        />
                      ))
                    ) : (
                      <div className="rounded-[1.6rem] border-2 border-dashed border-orange-300 bg-orange-50 p-6 sm:p-7">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="max-w-2xl">
                            <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-700">
                              Application Planning Stage
                            </p>
                            <h4 className="mt-2 text-2xl font-black text-[#17324d]">
                              No application is visible yet — that&apos;s okay
                            </h4>
                            <p className="mt-3 text-sm leading-6 text-[#607487]">
                              Start with the right university shortlist, confirm your course and intake,
                              prepare documents, then let Zaifan move the first application into your Student OS.
                            </p>
                          </div>

                          <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                            <button
                              type="button"
                              onClick={() => setActiveTab("universities")}
                              className="flex items-center justify-between rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-xs font-black text-white transition hover:bg-[#214e78]"
                            >
                              <span>Build University Plan</span>
                              <span>→</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab("counselor")}
                              className="flex items-center justify-between rounded-xl border-2 border-orange-400 bg-white px-4 py-3 text-xs font-black text-orange-700 transition hover:bg-orange-100"
                            >
                              <span>Ask Counselor</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <ApplicationStartStep
                            step="01"
                            title="Choose Universities"
                            text="Build a focused shortlist."
                            tone="teal"
                          />
                          <ApplicationStartStep
                            step="02"
                            title="Confirm Course"
                            text="Lock the right program and intake."
                            tone="orange"
                          />
                          <ApplicationStartStep
                            step="03"
                            title="Prepare Documents"
                            text="Get required files ready."
                            tone="amber"
                          />
                          <ApplicationStartStep
                            step="04"
                            title="Launch Application"
                            text="Zaifan adds the live record."
                            tone="navy"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Latest Application Pulse
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {latestApplication?.id
                          ? latestApplication.university_name ||
                            latestApplication.university ||
                            "Latest Application"
                          : "No live application yet"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {latestApplication?.id
                          ? latestApplication.course_name ||
                            latestApplication.course ||
                            latestApplication.program ||
                            "Course information is not visible yet."
                          : "Your latest application will appear here as soon as a record is connected to your Student OS."}
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <ApplicationStageStat
                          label="Application"
                          value={formatStatus(summary.applicationStatus)}
                          tone="orange"
                        />
                        <ApplicationStageStat
                          label="Offer"
                          value={formatStatus(summary.offerStatus)}
                          tone="green"
                        />
                        <ApplicationStageStat
                          label="CAS"
                          value={formatStatus(summary.casStatus)}
                          tone="navy"
                        />
                        <ApplicationStageStat
                          label="Visa"
                          value={formatStatus(summary.visaStatus)}
                          tone="violet"
                        />
                      </div>

                      <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
                          Best next application move
                        </p>
                        <p className="mt-2 text-sm font-black leading-6 text-[#17324d]">
                          {latestApplication?.next_action ||
                            latestApplication?.nextAction ||
                            actionCenterItems.find((item) => item.targetTab === "applications")?.title ||
                            (applications.length
                              ? "Review your live application status and confirm the next required step."
                              : "Build your university shortlist and prepare for the first application.")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(applications.length ? "documents" : "universities")
                        }
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>
                          {applications.length ? "Check Application Readiness" : "Start Application Planning"}
                        </span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Application Readiness
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        What protects a strong submission?
                      </h3>
                    </div>

                    <div className="space-y-4 p-5">
                      <ApplicationReadinessRow
                        label="University Planning"
                        value={universities.length ? Math.min(100, universities.length * 34) : 0}
                        tone="teal"
                        onClick={() => setActiveTab("universities")}
                      />
                      <ApplicationReadinessRow
                        label="Application Readiness"
                        value={readiness.applicationReadiness}
                        tone="orange"
                        onClick={() => setActiveTab("applications")}
                      />
                      <ApplicationReadinessRow
                        label="Documents"
                        value={readiness.documentScore}
                        tone="amber"
                        onClick={() => setActiveTab("documents")}
                      />
                      <ApplicationReadinessRow
                        label="Tasks"
                        value={readiness.taskScore}
                        tone="rose"
                        onClick={() => setActiveTab("tasks")}
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Application Journey
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Understand what happens after an application starts
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("roadmap")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Full Journey Roadmap
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-5">
                  <ApplicationJourneyStep
                    step="01"
                    title="Planned"
                    value={applications.length ? "Started" : "Current"}
                    tone="teal"
                  />
                  <ApplicationJourneyStep
                    step="02"
                    title="Submitted"
                    value={formatStatus(summary.applicationStatus)}
                    tone="orange"
                  />
                  <ApplicationJourneyStep
                    step="03"
                    title="Offer"
                    value={formatStatus(summary.offerStatus)}
                    tone="green"
                  />
                  <ApplicationJourneyStep
                    step="04"
                    title="CAS"
                    value={formatStatus(summary.casStatus)}
                    tone="navy"
                  />
                  <ApplicationJourneyStep
                    step="05"
                    title="Visa"
                    value={formatStatus(summary.visaStatus)}
                    tone="violet"
                  />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ApplicationShortcutCard
                  eyebrow="Universities"
                  title={`${universities.length} option${universities.length === 1 ? "" : "s"}`}
                  text="Review the shortlist that feeds your application plan."
                  tone="teal"
                  onClick={() => setActiveTab("universities")}
                />
                <ApplicationShortcutCard
                  eyebrow="Documents"
                  title={`${readiness.documentScore}% ready`}
                  text="Keep required files ready so submissions do not stall."
                  tone="amber"
                  onClick={() => setActiveTab("documents")}
                />
                <ApplicationShortcutCard
                  eyebrow="Tasks"
                  title={`${summary.pendingTasksCount || 0} pending`}
                  text="Clear application-related work before it becomes a deadline problem."
                  tone="orange"
                  onClick={() => setActiveTab("tasks")}
                />
                <ApplicationShortcutCard
                  eyebrow="Counselor"
                  title={counselorCenter.counselorName || "Zaifan Counselor"}
                  text="Ask for guidance when a course, offer or next application move is unclear."
                  tone="violet"
                  onClick={() => setActiveTab("counselor")}
                />
              </section>
            </div>
          ) : null}
          {activeTab === "visa" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Visa & CAS Command Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      See exactly how close you are to CAS and visa readiness
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Offer, CAS, documents, finance and visa preparation are connected here so the
                      student can understand what is ready, what is missing and what must happen next.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("applications")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Applications
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("counselor")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Ask My Counselor
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <VisaCommandStat
                    label="Offer Stage"
                    value={formatStatus(summary.offerStatus)}
                    helper="Latest visible offer position"
                    tone="green"
                  />
                  <VisaCommandStat
                    label="CAS Readiness"
                    value={`${readiness.casReadiness}%`}
                    helper={
                      readiness.casReadiness >= 75
                        ? "CAS preparation is strong"
                        : "CAS still needs preparation"
                    }
                    tone="navy"
                  />
                  <VisaCommandStat
                    label="Visa Readiness"
                    value={`${readiness.visaReadiness}%`}
                    helper={
                      readiness.visaReadiness >= 75
                        ? "Visa preparation is strong"
                        : "Visa still needs preparation"
                    }
                    tone="violet"
                  />
                  <VisaCommandStat
                    label="Document Score"
                    value={`${readiness.documentScore}%`}
                    helper="Documents supporting CAS and visa"
                    tone="amber"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Visa Journey
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        From offer acceptance to visa decision
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {Math.min(readiness.casReadiness, readiness.visaReadiness)}% minimum ready
                    </span>
                  </div>

                  <div className="space-y-3 p-4 sm:p-5">
                    <VisaJourneyStage
                      step="01"
                      title="Offer Received"
                      status={formatStatus(summary.offerStatus)}
                      text="A valid offer is the foundation for CAS preparation."
                      tone="green"
                      active={[
                        "offer_received",
                        "offer_accepted",
                      ].includes(String(summary.offerStatus || "").toLowerCase())}
                      complete={
                        String(summary.offerStatus || "").toLowerCase() ===
                        "offer_accepted"
                      }
                      onClick={() => setActiveTab("applications")}
                    />

                    <VisaJourneyStage
                      step="02"
                      title="CAS Preparation"
                      status={`${readiness.casReadiness}% ready`}
                      text="Documents, financial evidence and offer conditions must be ready before CAS can progress."
                      tone="navy"
                      active={
                        String(summary.offerStatus || "").toLowerCase() ===
                          "offer_accepted" &&
                        String(summary.casStatus || "").toLowerCase() !==
                          "cas_issued"
                      }
                      complete={
                        String(summary.casStatus || "").toLowerCase() ===
                        "cas_issued"
                      }
                      onClick={() => setActiveTab("documents")}
                    />

                    <VisaJourneyStage
                      step="03"
                      title="CAS Issued"
                      status={formatStatus(summary.casStatus)}
                      text="Once CAS is issued, visa preparation becomes the main priority."
                      tone="orange"
                      active={
                        String(summary.casStatus || "").toLowerCase() ===
                        "cas_issued"
                      }
                      complete={
                        String(summary.casStatus || "").toLowerCase() ===
                        "cas_issued"
                      }
                      onClick={() => setActiveTab("visa")}
                    />

                    <VisaJourneyStage
                      step="04"
                      title="Visa Preparation"
                      status={`${readiness.visaReadiness}% ready`}
                      text="Prepare passport, financial evidence, documents and any required visa items."
                      tone="violet"
                      active={
                        String(summary.casStatus || "").toLowerCase() ===
                          "cas_issued" &&
                        String(summary.visaStatus || "").toLowerCase() !==
                          "visa_approved"
                      }
                      complete={
                        String(summary.visaStatus || "").toLowerCase() ===
                        "visa_approved"
                      }
                      onClick={() => setActiveTab("documents")}
                    />

                    <VisaJourneyStage
                      step="05"
                      title="Visa Decision"
                      status={formatStatus(summary.visaStatus)}
                      text="Track the final visa stage and prepare for travel after approval."
                      tone="rose"
                      active={
                        String(summary.visaStatus || "").toLowerCase() ===
                        "visa_approved"
                      }
                      complete={
                        String(summary.visaStatus || "").toLowerCase() ===
                        "visa_approved"
                      }
                      onClick={() => setActiveTab("success")}
                    />
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Current Visa Position
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {formatStatus(summary.visaStatus)}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Your current visa position based on the latest Student OS records.
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <VisaMiniStat
                          label="Offer"
                          value={formatStatus(summary.offerStatus)}
                          tone="green"
                        />
                        <VisaMiniStat
                          label="CAS"
                          value={formatStatus(summary.casStatus)}
                          tone="navy"
                        />
                        <VisaMiniStat
                          label="CAS Ready"
                          value={`${readiness.casReadiness}%`}
                          tone="orange"
                        />
                        <VisaMiniStat
                          label="Visa Ready"
                          value={`${readiness.visaReadiness}%`}
                          tone="violet"
                        />
                      </div>

                      <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
                          Best next visa move
                        </p>
                        <p className="mt-2 text-sm font-black leading-6 text-[#17324d]">
                          {actionCenterItems.find((item) => item.targetTab === "visa")?.title ||
                            (readiness.documentScore < 100
                              ? "Improve your document readiness before the next CAS or visa step."
                              : String(summary.casStatus || "").toLowerCase() !== "cas_issued"
                              ? "Confirm what is still required for CAS preparation."
                              : String(summary.visaStatus || "").toLowerCase() !== "visa_approved"
                              ? "Prepare and verify the remaining visa requirements."
                              : "Visa approved — continue to travel and arrival preparation.")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            readiness.documentScore < 100
                              ? "documents"
                              : String(summary.casStatus || "").toLowerCase() !== "cas_issued"
                              ? "counselor"
                              : "actions"
                          )
                        }
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>Open Next Visa Step</span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Readiness Control
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        What can block CAS or visa progress?
                      </h3>
                    </div>

                    <div className="space-y-4 p-5">
                      <VisaReadinessRow
                        label="Application Readiness"
                        value={readiness.applicationReadiness}
                        tone="orange"
                        onClick={() => setActiveTab("applications")}
                      />
                      <VisaReadinessRow
                        label="Document Readiness"
                        value={readiness.documentScore}
                        tone="amber"
                        onClick={() => setActiveTab("documents")}
                      />
                      <VisaReadinessRow
                        label="CAS Readiness"
                        value={readiness.casReadiness}
                        tone="navy"
                        onClick={() => setActiveTab("visa")}
                      />
                      <VisaReadinessRow
                        label="Visa Readiness"
                        value={readiness.visaReadiness}
                        tone="violet"
                        onClick={() => setActiveTab("visa")}
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Visa Requirements
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Key items students usually need to keep ready
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("documents")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Open Documents
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <VisaRequirementCard
                    title="Passport"
                    text="Keep passport details and validity ready for visa processing."
                    tone="navy"
                  />
                  <VisaRequirementCard
                    title="Offer / CAS"
                    text="Your university offer and CAS status drive the next visa stage."
                    tone="green"
                  />
                  <VisaRequirementCard
                    title="Financial Evidence"
                    text="Prepare the financial documents required for your visa route."
                    tone="amber"
                  />
                  <VisaRequirementCard
                    title="Supporting Documents"
                    text="Keep requested academic, identity and visa-related files complete and current."
                    tone="violet"
                  />
                </div>

                <div className="px-4 pb-5 sm:px-5">
                  <div className="rounded-xl border-2 border-sky-200 bg-sky-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">
                      Important
                    </p>
                    <p className="mt-2 text-[11px] leading-5 text-[#607487]">
                      The exact visa requirements can depend on destination, university, intake and the student&apos;s case.
                      Use the documents and counselor workspaces for the requirements connected to your actual record.
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <VisaShortcutCard
                  eyebrow="Applications"
                  title={formatStatus(summary.applicationStatus)}
                  text="Offer and application movement directly affect CAS preparation."
                  tone="orange"
                  onClick={() => setActiveTab("applications")}
                />
                <VisaShortcutCard
                  eyebrow="Documents"
                  title={`${readiness.documentScore}% ready`}
                  text="Complete and accepted documents protect both CAS and visa timelines."
                  tone="amber"
                  onClick={() => setActiveTab("documents")}
                />
                <VisaShortcutCard
                  eyebrow="Deadlines"
                  title={`${deadlineCenter.urgentCount} urgent`}
                  text="Check any time-sensitive CAS or visa actions before they become blockers."
                  tone={deadlineCenter.urgentCount ? "rose" : "green"}
                  onClick={() => setActiveTab("deadlines")}
                />
                <VisaShortcutCard
                  eyebrow="Counselor"
                  title={counselorCenter.counselorName || "Zaifan Counselor"}
                  text="Ask for guidance whenever a visa or CAS requirement is unclear."
                  tone="violet"
                  onClick={() => setActiveTab("counselor")}
                />
              </section>
            </div>
          ) : null}
          {activeTab === "documents" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Document Command Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Know what is ready, what is missing and what needs attention
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Your documents support applications, offers, CAS and visa preparation.
                      Student OS keeps the visible document status, review notes and file access in one place.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("counselor")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Request Document Help
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("applications")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Applications
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <DocumentCommandStat
                    label="Visible Documents"
                    value={documents.length}
                    helper={documents.length ? "Connected to your student record" : "No document records yet"}
                    tone="navy"
                  />
                  <DocumentCommandStat
                    label="Readiness"
                    value={`${readiness.documentScore}%`}
                    helper={
                      readiness.documentScore >= 75
                        ? "Document position is healthy"
                        : "More document work is needed"
                    }
                    tone={readiness.documentScore >= 75 ? "green" : "amber"}
                  />
                  <DocumentCommandStat
                    label="Approved"
                    value={
                      documents.filter((doc) => {
                        const status = normalize(doc.status || doc.document_status);
                        return status.includes("approved") || status.includes("complete");
                      }).length
                    }
                    helper="Accepted / completed records"
                    tone="green"
                  />
                  <DocumentCommandStat
                    label="Needs Attention"
                    value={
                      documents.filter((doc) => {
                        const status = normalize(doc.status || doc.document_status);
                        return (
                          status.includes("rejected") ||
                          status.includes("missing") ||
                          status.includes("pending") ||
                          status.includes("review")
                        );
                      }).length
                    }
                    helper="Missing, rejected or under review"
                    tone="rose"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        My Documents
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        Every visible file and review state
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {documents.length} record{documents.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    {documents.length ? (
                      documents.map((document, index) => (
                        <PremiumStudentDocumentCard
                          key={document.id || `${document.document_name}-${index}`}
                          document={document}
                          index={index}
                          onHelp={() => setActiveTab("counselor")}
                        />
                      ))
                    ) : (
                      <div className="rounded-[1.6rem] border-2 border-dashed border-amber-300 bg-amber-50 p-6 sm:p-7">
                        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-amber-700">
                          Document Workspace Ready
                        </p>
                        <h4 className="mt-2 text-2xl font-black text-[#17324d]">
                          No document record is visible yet
                        </h4>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#607487]">
                          When Zaifan requests or reviews documents for your case, the visible records will appear here.
                          Use your counselor or support center when you need clarification about what should be prepared first.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab("counselor")}
                            className="flex items-center justify-between rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-xs font-black text-white transition hover:bg-[#214e78]"
                          >
                            <span>Ask My Counselor</span>
                            <span>→</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("support")}
                            className="flex items-center justify-between rounded-xl border-2 border-amber-400 bg-white px-4 py-3 text-xs font-black text-amber-800 transition hover:bg-amber-100"
                          >
                            <span>Request Document Review</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Document Readiness
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {readiness.documentScore}% ready
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        This score is based on the visible document records and their review status.
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="h-3 overflow-hidden rounded-full bg-[#edf1f4]">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: String(readiness.documentScore) + "%" }}
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <DocumentMiniStat
                          label="Applications"
                          value={`${readiness.applicationReadiness}%`}
                          tone="orange"
                        />
                        <DocumentMiniStat
                          label="CAS"
                          value={`${readiness.casReadiness}%`}
                          tone="navy"
                        />
                        <DocumentMiniStat
                          label="Visa"
                          value={`${readiness.visaReadiness}%`}
                          tone="violet"
                        />
                        <DocumentMiniStat
                          label="Portal Health"
                          value={`${analytics.overallHealth}%`}
                          tone="green"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(
                            readiness.documentScore < 100 ? "counselor" : "applications"
                          )
                        }
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>
                          {readiness.documentScore < 100
                            ? "Ask What Document Comes Next"
                            : "Continue Application Journey"}
                        </span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Review Intelligence
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        What needs your attention?
                      </h3>
                    </div>

                    <div className="space-y-3 p-5">
                      <DocumentHealthRow
                        label="Approved"
                        value={
                          documents.filter((doc) => {
                            const status = normalize(doc.status || doc.document_status);
                            return status.includes("approved") || status.includes("complete");
                          }).length
                        }
                        total={documents.length}
                        tone="green"
                      />
                      <DocumentHealthRow
                        label="Pending / Review"
                        value={
                          documents.filter((doc) => {
                            const status = normalize(doc.status || doc.document_status);
                            return status.includes("pending") || status.includes("review");
                          }).length
                        }
                        total={documents.length}
                        tone="orange"
                      />
                      <DocumentHealthRow
                        label="Rejected"
                        value={
                          documents.filter((doc) =>
                            normalize(doc.status || doc.document_status).includes("rejected")
                          ).length
                        }
                        total={documents.length}
                        tone="rose"
                      />
                      <DocumentHealthRow
                        label="Missing"
                        value={
                          documents.filter((doc) =>
                            normalize(doc.status || doc.document_status).includes("missing")
                          ).length
                        }
                        total={documents.length}
                        tone="amber"
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Document Journey
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Why documents matter at every stage
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("roadmap")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Open Roadmap
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <DocumentJourneyCard
                    step="01"
                    title="Application"
                    text="Academic and identity documents help Zaifan prepare strong university applications."
                    tone="orange"
                    onClick={() => setActiveTab("applications")}
                  />
                  <DocumentJourneyCard
                    step="02"
                    title="Offer Conditions"
                    text="Some offers require additional evidence before conditions can be cleared."
                    tone="green"
                    onClick={() => setActiveTab("applications")}
                  />
                  <DocumentJourneyCard
                    step="03"
                    title="CAS"
                    text="CAS preparation depends on the university receiving the required supporting evidence."
                    tone="navy"
                    onClick={() => setActiveTab("visa")}
                  />
                  <DocumentJourneyCard
                    step="04"
                    title="Visa"
                    text="Visa preparation relies on complete, current and case-specific supporting documents."
                    tone="violet"
                    onClick={() => setActiveTab("visa")}
                  />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DocumentShortcutCard
                  eyebrow="Applications"
                  title={formatStatus(summary.applicationStatus)}
                  text="See which application stage your documents are supporting."
                  tone="orange"
                  onClick={() => setActiveTab("applications")}
                />
                <DocumentShortcutCard
                  eyebrow="CAS / Visa"
                  title={`${Math.min(readiness.casReadiness, readiness.visaReadiness)}% minimum`}
                  text="Document readiness is one of the strongest protections for CAS and visa progress."
                  tone="violet"
                  onClick={() => setActiveTab("visa")}
                />
                <DocumentShortcutCard
                  eyebrow="Deadlines"
                  title={`${deadlineCenter.urgentCount} urgent`}
                  text="Check time-sensitive document or application work before it becomes a blocker."
                  tone={deadlineCenter.urgentCount ? "rose" : "green"}
                  onClick={() => setActiveTab("deadlines")}
                />
                <DocumentShortcutCard
                  eyebrow="Counselor"
                  title={counselorCenter.counselorName || "Zaifan Counselor"}
                  text="Ask exactly what is missing, rejected or still required."
                  tone="navy"
                  onClick={() => setActiveTab("counselor")}
                />
              </section>
            </div>
          ) : null}
          {activeTab === "tasks" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Task Command
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Know what to do next — before anything becomes overdue
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Assigned work, counselor follow-ups, document actions and application tasks stay together
                      so you can focus on the right thing first instead of searching across the portal.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("actions")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Action Center
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("deadlines")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Deadlines
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <TaskCommandStat
                    label="Total Tasks"
                    value={tasks.length}
                    helper={tasks.length ? "All visible assigned work" : "No tasks assigned"}
                    tone="navy"
                  />
                  <TaskCommandStat
                    label="Pending"
                    value={
                      tasks.filter((task) => {
                        const status = normalize(task.status);
                        return !status.includes("done") && !status.includes("complete") && !status.includes("cancel");
                      }).length
                    }
                    helper="Still needs action"
                    tone="orange"
                  />
                  <TaskCommandStat
                    label="Overdue"
                    value={overdueTasks.length}
                    helper={overdueTasks.length ? "Recover these first" : "Nothing overdue"}
                    tone={overdueTasks.length ? "rose" : "green"}
                  />
                  <TaskCommandStat
                    label="Task Readiness"
                    value={`${readiness.taskScore}%`}
                    helper={readiness.taskScore >= 75 ? "Task position is healthy" : "More work needs clearing"}
                    tone={readiness.taskScore >= 75 ? "green" : "violet"}
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        My Task Queue
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        Work in priority order
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {tasks.length} task{tasks.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    {tasks.length ? (
                      [...tasks]
                        .sort((a, b) => {
                          const priorityRank = { urgent: 4, high: 3, medium: 2, low: 1 };
                          const aPriority = priorityRank[normalize(a.priority)] || 0;
                          const bPriority = priorityRank[normalize(b.priority)] || 0;
                          if (aPriority !== bPriority) return bPriority - aPriority;

                          const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
                          const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
                          return aDue - bDue;
                        })
                        .map((task, index) => (
                          <PremiumStudentTaskCard
                            key={task.id || `${task.title}-${index}`}
                            task={task}
                            index={index}
                            onCounselor={() => setActiveTab("counselor")}
                            onDeadlines={() => setActiveTab("deadlines")}
                          />
                        ))
                    ) : (
                      <div className="rounded-[1.6rem] border-2 border-dashed border-emerald-300 bg-emerald-50 p-6 sm:p-7">
                        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-emerald-700">
                          Task Queue Clear
                        </p>
                        <h4 className="mt-2 text-2xl font-black text-[#17324d]">
                          No task is assigned right now
                        </h4>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#607487]">
                          New counselor or operations tasks connected to your student record will appear here.
                          Keep checking your deadlines, documents and messages so nothing important is missed.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Best Next Task
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {tasks?.[0]?.title || "No task is pressing right now"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {tasks?.[0]?.description ||
                          tasks?.[0]?.notes ||
                          "Your current task queue does not show a pressing action."}
                      </p>
                    </div>

                    <div className="p-5">
                      {tasks?.[0] ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <TaskMiniStat
                              label="Priority"
                              value={formatStatus(tasks[0]?.priority || "normal")}
                              tone={normalize(tasks[0]?.priority).includes("high") || normalize(tasks[0]?.priority).includes("urgent") ? "rose" : "orange"}
                            />
                            <TaskMiniStat
                              label="Due"
                              value={formatDate(tasks[0]?.due_date)}
                              tone="navy"
                            />
                          </div>

                          <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
                              Why this matters
                            </p>
                            <p className="mt-2 text-sm font-black leading-6 text-[#17324d]">
                              {tasks[0]?.description ||
                                tasks[0]?.notes ||
                                "Complete the task before its due date so your journey can keep moving."}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveTab("actions")}
                            className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                          >
                            <span>Open Full Action Center</span>
                            <span>→</span>
                          </button>
                        </>
                      ) : (
                        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-sm font-black text-emerald-800">You&apos;re caught up.</p>
                          <p className="mt-1 text-xs leading-5 text-emerald-700/80">
                            Continue monitoring your applications, documents, messages and deadlines.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Task Health
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        Is your workload under control?
                      </h3>
                    </div>

                    <div className="space-y-4 p-5">
                      <TaskHealthRow
                        label="Task Readiness"
                        value={readiness.taskScore}
                        tone="orange"
                      />
                      <TaskHealthRow
                        label="Application Readiness"
                        value={readiness.applicationReadiness}
                        tone="navy"
                      />
                      <TaskHealthRow
                        label="Document Readiness"
                        value={readiness.documentScore}
                        tone="amber"
                      />
                      <TaskHealthRow
                        label="Portal Health"
                        value={analytics.overallHealth}
                        tone="green"
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Workload Breakdown
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Understand the type of work sitting in your queue
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("deadlines")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Check Deadlines
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <TaskWorkloadCard
                    title="Urgent / High"
                    value={
                      tasks.filter((task) => {
                        const priority = normalize(task.priority);
                        return priority.includes("urgent") || priority.includes("high");
                      }).length
                    }
                    text="These should normally be reviewed before lower-priority work."
                    tone="rose"
                  />
                  <TaskWorkloadCard
                    title="Overdue"
                    value={overdueTasks.length}
                    text="Overdue work should be recovered first to protect your timeline."
                    tone={overdueTasks.length ? "rose" : "green"}
                  />
                  <TaskWorkloadCard
                    title="Pending"
                    value={
                      tasks.filter((task) => {
                        const status = normalize(task.status);
                        return !status.includes("done") && !status.includes("complete") && !status.includes("cancel");
                      }).length
                    }
                    text="Active work still waiting for completion."
                    tone="orange"
                  />
                  <TaskWorkloadCard
                    title="Completed"
                    value={
                      tasks.filter((task) => {
                        const status = normalize(task.status);
                        return status.includes("done") || status.includes("complete");
                      }).length
                    }
                    text="Finished work already cleared from your journey."
                    tone="green"
                  />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TaskShortcutCard
                  eyebrow="Documents"
                  title={`${readiness.documentScore}% ready`}
                  text="Many student tasks exist because a document needs uploading, correction or review."
                  tone="amber"
                  onClick={() => setActiveTab("documents")}
                />
                <TaskShortcutCard
                  eyebrow="Applications"
                  title={formatStatus(summary.applicationStatus)}
                  text="Application movement often creates the next important task."
                  tone="orange"
                  onClick={() => setActiveTab("applications")}
                />
                <TaskShortcutCard
                  eyebrow="Deadlines"
                  title={`${deadlineCenter.urgentCount} urgent`}
                  text="Check dates whenever a task is close to becoming overdue."
                  tone={deadlineCenter.urgentCount ? "rose" : "green"}
                  onClick={() => setActiveTab("deadlines")}
                />
                <TaskShortcutCard
                  eyebrow="Counselor"
                  title={counselorCenter.counselorName || "Zaifan Counselor"}
                  text="Ask for clarification when a task is unclear instead of completing the wrong action."
                  tone="violet"
                  onClick={() => setActiveTab("counselor")}
                />
              </section>
            </div>
          ) : null}
          {activeTab === "universities" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      University Planning Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Build the right shortlist before applications begin
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Keep every university option, course, category and planning status visible in one place
                      so your application journey starts with clear choices instead of random submissions.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("applications")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Applications
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("counselor")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Ask My Counselor
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <UniversityCommandStat
                    label="University Options"
                    value={universities.length}
                    helper={universities.length ? "Visible shortlist records" : "No shortlist started"}
                    tone="navy"
                  />
                  <UniversityCommandStat
                    label="Application Readiness"
                    value={`${readiness.applicationReadiness}%`}
                    helper={
                      readiness.applicationReadiness >= 75
                        ? "Planning supports application movement"
                        : "More preparation is needed"
                    }
                    tone="orange"
                  />
                  <UniversityCommandStat
                    label="Applications"
                    value={applications.length}
                    helper={applications.length ? "Applications already connected" : "No application launched"}
                    tone="green"
                  />
                  <UniversityCommandStat
                    label="Current Country"
                    value={
                      student?.country ||
                      student?.country_interest ||
                      student?.preferred_country ||
                      "Not set"
                    }
                    helper="Destination on your current record"
                    tone="violet"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        My University Shortlist
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        Compare every option before you commit
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {universities.length} option{universities.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    {universities.length ? (
                      universities.map((university, index) => (
                        <PremiumUniversityCard
                          key={university.id || `${university.university_name}-${index}`}
                          university={university}
                          index={index}
                          onApplications={() => setActiveTab("applications")}
                          onCounselor={() => setActiveTab("counselor")}
                        />
                      ))
                    ) : (
                      <div className="rounded-[1.6rem] border-2 border-dashed border-teal-300 bg-teal-50 p-6 sm:p-7">
                        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-teal-700">
                          Shortlist Not Started
                        </p>
                        <h4 className="mt-2 text-2xl font-black text-[#17324d]">
                          Your university plan is still waiting to be built
                        </h4>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#607487]">
                          Start by confirming the destination, course direction, budget and intake with your counselor.
                          Once options are added to your student record, they will appear here for comparison.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab("counselor")}
                            className="flex items-center justify-between rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-xs font-black text-white transition hover:bg-[#214e78]"
                          >
                            <span>Build Shortlist With Counselor</span>
                            <span>→</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("roadmap")}
                            className="flex items-center justify-between rounded-xl border-2 border-teal-400 bg-white px-4 py-3 text-xs font-black text-teal-800 transition hover:bg-teal-100"
                          >
                            <span>View Journey Roadmap</span>
                            <span>→</span>
                          </button>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <UniversityPlanningStep
                            step="01"
                            title="Destination"
                            text="Confirm the country that fits your goals."
                            tone="navy"
                          />
                          <UniversityPlanningStep
                            step="02"
                            title="Course"
                            text="Choose the right academic direction."
                            tone="teal"
                          />
                          <UniversityPlanningStep
                            step="03"
                            title="Budget & Intake"
                            text="Match affordability and timeline."
                            tone="amber"
                          />
                          <UniversityPlanningStep
                            step="04"
                            title="Shortlist"
                            text="Compare options before applying."
                            tone="orange"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Shortlist Pulse
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {universities.length
                          ? universities[0]?.university_name ||
                            universities[0]?.name ||
                            "Top University Option"
                          : "No university selected yet"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {universities.length
                          ? universities[0]?.course_name ||
                            universities[0]?.course ||
                            universities[0]?.program ||
                            universities[0]?.country ||
                            "Your first visible shortlist option."
                          : "Your first shortlisted university will appear here once Zaifan connects it to your student record."}
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <UniversityMiniStat
                          label="Options"
                          value={universities.length}
                          tone="teal"
                        />
                        <UniversityMiniStat
                          label="Applications"
                          value={applications.length}
                          tone="orange"
                        />
                        <UniversityMiniStat
                          label="Documents"
                          value={`${readiness.documentScore}%`}
                          tone="amber"
                        />
                        <UniversityMiniStat
                          label="Journey"
                          value={`${journeyProgress}%`}
                          tone="navy"
                        />
                      </div>

                      <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
                          Best next university move
                        </p>
                        <p className="mt-2 text-sm font-black leading-6 text-[#17324d]">
                          {universities.length
                            ? applications.length
                              ? "Review the current shortlist against your live applications and confirm whether another option is needed."
                              : "Compare the shortlisted options and confirm which university should move into the first application."
                            : "Start with destination, course, budget and intake before choosing universities."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTab(universities.length ? "applications" : "counselor")
                        }
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>
                          {universities.length ? "Move Toward Application" : "Start University Planning"}
                        </span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Planning Readiness
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        Is your shortlist ready to become an application?
                      </h3>
                    </div>

                    <div className="space-y-4 p-5">
                      <UniversityReadinessRow
                        label="University Options"
                        value={universities.length ? Math.min(100, universities.length * 34) : 0}
                        tone="teal"
                      />
                      <UniversityReadinessRow
                        label="Application Readiness"
                        value={readiness.applicationReadiness}
                        tone="orange"
                      />
                      <UniversityReadinessRow
                        label="Documents"
                        value={readiness.documentScore}
                        tone="amber"
                      />
                      <UniversityReadinessRow
                        label="Task Readiness"
                        value={readiness.taskScore}
                        tone="navy"
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      University Decision Guide
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Compare the things that actually matter
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("counselor")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Discuss With Counselor
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <UniversityDecisionCard
                    step="01"
                    title="Course Fit"
                    text="Does the program actually match your academic background and career direction?"
                    tone="teal"
                  />
                  <UniversityDecisionCard
                    step="02"
                    title="Affordability"
                    text="Review tuition, living costs, scholarship possibilities and realistic family budget."
                    tone="amber"
                  />
                  <UniversityDecisionCard
                    step="03"
                    title="Admission Fit"
                    text="Check whether your grades, English profile and documents fit the university route."
                    tone="orange"
                  />
                  <UniversityDecisionCard
                    step="04"
                    title="Journey Fit"
                    text="Look at intake timing, city, visa route and whether the option supports your overall plan."
                    tone="navy"
                  />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <UniversityShortcutCard
                  eyebrow="Applications"
                  title={`${applications.length} record${applications.length === 1 ? "" : "s"}`}
                  text="See which shortlisted options have already moved into application."
                  tone="orange"
                  onClick={() => setActiveTab("applications")}
                />
                <UniversityShortcutCard
                  eyebrow="Documents"
                  title={`${readiness.documentScore}% ready`}
                  text="Strong documents make it easier to move the right university option forward."
                  tone="amber"
                  onClick={() => setActiveTab("documents")}
                />
                <UniversityShortcutCard
                  eyebrow="Roadmap"
                  title={`${journeyProgress}% complete`}
                  text="See where university planning sits inside the full study-abroad journey."
                  tone="navy"
                  onClick={() => setActiveTab("roadmap")}
                />
                <UniversityShortcutCard
                  eyebrow="Counselor"
                  title={counselorCenter.counselorName || "Zaifan Counselor"}
                  text="Use counselor guidance to compare options before committing to an application."
                  tone="violet"
                  onClick={() => setActiveTab("counselor")}
                />
              </section>
            </div>
          ) : null}
          {activeTab === "messages" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Communication Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Keep every important conversation tied to your journey
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Counselor updates, WhatsApp drafts, support communication and journey messages
                      stay visible here so you do not have to remember what was said or where it came from.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("counselor")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      My Counselor
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("support")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Support Center
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <MessageCommandStat
                    label="Messages"
                    value={communications.length}
                    helper={communications.length ? "Visible communication records" : "No messages yet"}
                    tone="navy"
                  />
                  <MessageCommandStat
                    label="WhatsApp"
                    value={
                      communications.filter((item) =>
                        normalize(item.channel || item.type).includes("whatsapp")
                      ).length
                    }
                    helper="WhatsApp-linked communication"
                    tone="green"
                  />
                  <MessageCommandStat
                    label="Pending / Queued"
                    value={
                      communications.filter((item) => {
                        const status = normalize(item.status);
                        return (
                          status.includes("queued") ||
                          status.includes("pending") ||
                          status.includes("draft")
                        );
                      }).length
                    }
                    helper="Waiting to be sent or completed"
                    tone="orange"
                  />
                  <MessageCommandStat
                    label="Counselor"
                    value={counselorCenter.counselorName || "Zaifan Counselor"}
                    helper="Your guidance contact"
                    tone="violet"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Communication History
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        Every visible message in one clear feed
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {communications.length} record{communications.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    {communications.length ? (
                      [...communications]
                        .sort((a, b) => {
                          const aTime = new Date(a?.created_at || a?.updated_at || 0).getTime();
                          const bTime = new Date(b?.created_at || b?.updated_at || 0).getTime();
                          return bTime - aTime;
                        })
                        .map((message, index) => (
                          <PremiumStudentMessageCard
                            key={message.id || `${message.created_at}-${index}`}
                            message={message}
                            index={index}
                            onCounselor={() => setActiveTab("counselor")}
                            onTimeline={() => setActiveTab("timeline")}
                          />
                        ))
                    ) : (
                      <div className="rounded-[1.6rem] border-2 border-dashed border-sky-300 bg-sky-50 p-6 sm:p-7">
                        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-sky-700">
                          Communication Feed Ready
                        </p>
                        <h4 className="mt-2 text-2xl font-black text-[#17324d]">
                          No message is visible yet
                        </h4>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#607487]">
                          Counselor-safe messages and communication records linked to your student case will appear here.
                          Use Counselor or Support when you need to start a conversation.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab("counselor")}
                            className="flex items-center justify-between rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-xs font-black text-white transition hover:bg-[#214e78]"
                          >
                            <span>Contact Counselor</span>
                            <span>→</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("support")}
                            className="flex items-center justify-between rounded-xl border-2 border-sky-400 bg-white px-4 py-3 text-xs font-black text-sky-800 transition hover:bg-sky-100"
                          >
                            <span>Create Support Request</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Latest Communication
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {communications.length
                          ? communications[0]?.subject ||
                            formatStatus(communications[0]?.channel) ||
                            "Latest Message"
                          : "No communication yet"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {communications.length
                          ? communications[0]?.message ||
                            communications[0]?.body ||
                            communications[0]?.notes ||
                            "Communication record"
                          : "Your latest counselor-safe communication will appear here once one is connected."}
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <MessageMiniStat
                          label="Channel"
                          value={
                            communications.length
                              ? formatStatus(communications[0]?.channel || "message")
                              : "—"
                          }
                          tone="sky"
                        />
                        <MessageMiniStat
                          label="Status"
                          value={
                            communications.length
                              ? formatStatus(communications[0]?.status || "visible")
                              : "—"
                          }
                          tone="orange"
                        />
                        <MessageMiniStat
                          label="Created"
                          value={
                            communications.length
                              ? formatDate(communications[0]?.created_at)
                              : "—"
                          }
                          tone="navy"
                        />
                        <MessageMiniStat
                          label="Total"
                          value={communications.length}
                          tone="green"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab("timeline")}
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>Open Communication Timeline</span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Communication Health
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        Are you staying connected?
                      </h3>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      <MessageHealthCard
                        label="Counselor"
                        value={counselorCenter.counselorName || "Zaifan Counselor"}
                        helper="Primary guidance contact"
                        tone="violet"
                      />
                      <MessageHealthCard
                        label="Support Open"
                        value={supportAnalytics.open || 0}
                        helper="Requests still waiting"
                        tone={supportAnalytics.open ? "orange" : "green"}
                      />
                      <MessageHealthCard
                        label="Timeline Events"
                        value={summary.timelineCount || 0}
                        helper="Journey communication history"
                        tone="navy"
                      />
                      <MessageHealthCard
                        label="Notifications"
                        value={notifications.length || 0}
                        helper="Portal alerts and updates"
                        tone="pink"
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      When To Message Zaifan
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Use communication when a clear answer can prevent a mistake
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("counselor")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Open Counselor Center
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <MessageReasonCard
                    step="01"
                    title="Application question"
                    text="Ask when a course, university, offer condition or next application step is unclear."
                    tone="orange"
                  />
                  <MessageReasonCard
                    step="02"
                    title="Document problem"
                    text="Share context when a document is missing, rejected or difficult to prepare."
                    tone="amber"
                  />
                  <MessageReasonCard
                    step="03"
                    title="CAS / Visa question"
                    text="Ask before acting when CAS or visa requirements do not make sense."
                    tone="violet"
                  />
                  <MessageReasonCard
                    step="04"
                    title="Deadline pressure"
                    text="Contact Zaifan early when timing is tight or a task may become overdue."
                    tone="rose"
                  />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MessageShortcutCard
                  eyebrow="Counselor"
                  title={counselorCenter.counselorName || "Zaifan Counselor"}
                  text="Open the dedicated guidance center for counselor contact and journey help."
                  tone="violet"
                  onClick={() => setActiveTab("counselor")}
                />
                <MessageShortcutCard
                  eyebrow="Support"
                  title={`${supportAnalytics.open || 0} open`}
                  text="Create and track formal support requests when an issue needs follow-up."
                  tone="sky"
                  onClick={() => setActiveTab("support")}
                />
                <MessageShortcutCard
                  eyebrow="Timeline"
                  title={`${summary.timelineCount || 0} events`}
                  text="See communication alongside the rest of your student journey history."
                  tone="navy"
                  onClick={() => setActiveTab("timeline")}
                />
                <MessageShortcutCard
                  eyebrow="Notifications"
                  title={`${notifications.length || 0} alerts`}
                  text="Check portal updates that may require a response or next action."
                  tone="pink"
                  onClick={() => setActiveTab("notifications")}
                />
              </section>
            </div>
          ) : null}
          {activeTab === "timeline" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Journey Timeline
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Your complete case history — in the order it happened
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Tasks, messages, application activity, document changes and Zaifan actions can appear here
                      as one chronological journey so you can understand what changed and who moved it.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("messages")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Messages
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("actions")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Action Center
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <TimelineCommandStat
                    label="Timeline Events"
                    value={timeline.length}
                    helper={timeline.length ? "Visible journey activity" : "No events yet"}
                    tone="navy"
                  />
                  <TimelineCommandStat
                    label="Latest Activity"
                    value={timeline.length ? formatDate(timeline[0]?.created_at) : "—"}
                    helper="Newest visible timeline event"
                    tone="orange"
                  />
                  <TimelineCommandStat
                    label="Admin / Team"
                    value={
                      timeline.filter((item) => {
                        const by = normalize(item.created_by_name || item.created_by || item.actor);
                        return by.includes("admin") || by.includes("zaifan") || by.includes("team");
                      }).length
                    }
                    helper="Team-created journey events"
                    tone="green"
                  />
                  <TimelineCommandStat
                    label="Journey Progress"
                    value={`${journeyProgress}%`}
                    helper={successCenter.stageLabel}
                    tone="violet"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Journey Activity Feed
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        Newest activity first
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {timeline.length} event{timeline.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5">
                    {timeline.length ? (
                      <div className="relative">
                        <div className="absolute bottom-4 left-[22px] top-4 hidden w-[2px] bg-[#dbe5ec] sm:block" />

                        <div className="space-y-4">
                          {[...timeline]
                            .sort((a, b) => {
                              const aTime = new Date(a?.created_at || 0).getTime();
                              const bTime = new Date(b?.created_at || 0).getTime();
                              return bTime - aTime;
                            })
                            .map((event, index) => (
                              <PremiumTimelineEvent
                                key={event.id || `${event.created_at}-${index}`}
                                event={event}
                                index={index}
                              />
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[1.6rem] border-2 border-dashed border-sky-300 bg-sky-50 p-6 sm:p-7">
                        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-sky-700">
                          Timeline Ready
                        </p>
                        <h4 className="mt-2 text-2xl font-black text-[#17324d]">
                          No journey event is visible yet
                        </h4>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#607487]">
                          As your case moves, timeline activity connected to applications, documents,
                          tasks, communication and staff actions can appear here automatically.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Latest Journey Move
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {timeline.length
                          ? timeline[0]?.title ||
                            formatStatus(timeline[0]?.action_type) ||
                            "Latest Timeline Event"
                          : "No journey activity yet"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {timeline.length
                          ? timeline[0]?.description ||
                            timeline[0]?.new_value ||
                            timeline[0]?.old_value ||
                            "Timeline activity updated."
                          : "Your most recent operational update will appear here once the timeline starts moving."}
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <TimelineMiniStat
                          label="Action"
                          value={
                            timeline.length
                              ? formatStatus(timeline[0]?.action_type || "activity")
                              : "—"
                          }
                          tone="orange"
                        />
                        <TimelineMiniStat
                          label="Date"
                          value={timeline.length ? formatDate(timeline[0]?.created_at) : "—"}
                          tone="navy"
                        />
                        <TimelineMiniStat
                          label="By"
                          value={
                            timeline.length
                              ? timeline[0]?.created_by_name || "Zaifan Team"
                              : "—"
                          }
                          tone="green"
                        />
                        <TimelineMiniStat
                          label="Events"
                          value={timeline.length}
                          tone="violet"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab("overview")}
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>Back to Journey Overview</span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Timeline Breakdown
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        What kind of activity is being recorded?
                      </h3>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      <TimelineBreakdownCard
                        label="Tasks"
                        value={
                          timeline.filter((item) =>
                            normalize(
                              `${item.action_type || ""} ${item.title || ""}`
                            ).includes("task")
                          ).length
                        }
                        tone="orange"
                      />
                      <TimelineBreakdownCard
                        label="Messages / WhatsApp"
                        value={
                          timeline.filter((item) => {
                            const text = normalize(
                              `${item.action_type || ""} ${item.title || ""}`
                            );
                            return text.includes("message") || text.includes("whatsapp");
                          }).length
                        }
                        tone="green"
                      />
                      <TimelineBreakdownCard
                        label="Application"
                        value={
                          timeline.filter((item) =>
                            normalize(
                              `${item.action_type || ""} ${item.title || ""}`
                            ).includes("application")
                          ).length
                        }
                        tone="sky"
                      />
                      <TimelineBreakdownCard
                        label="Documents"
                        value={
                          timeline.filter((item) =>
                            normalize(
                              `${item.action_type || ""} ${item.title || ""}`
                            ).includes("document")
                          ).length
                        }
                        tone="violet"
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Connected Journey Areas
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Timeline is the history layer for your whole Student OS
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("connections")}
                    className="w-fit rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#214e78]"
                  >
                    Zaifan Team Bridge
                  </button>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <TimelineConnectionCard
                    eyebrow="Applications"
                    title={`${applications.length} record${applications.length === 1 ? "" : "s"}`}
                    text="Application changes can become part of your chronological case history."
                    tone="orange"
                    onClick={() => setActiveTab("applications")}
                  />
                  <TimelineConnectionCard
                    eyebrow="Documents"
                    title={`${documents.length} record${documents.length === 1 ? "" : "s"}`}
                    text="Document requests, reviews and status changes belong to the same journey."
                    tone="amber"
                    onClick={() => setActiveTab("documents")}
                  />
                  <TimelineConnectionCard
                    eyebrow="Tasks"
                    title={`${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
                    text="Assigned and AI-created work can appear beside the rest of your operational history."
                    tone="rose"
                    onClick={() => setActiveTab("tasks")}
                  />
                  <TimelineConnectionCard
                    eyebrow="Messages"
                    title={`${communications.length} record${communications.length === 1 ? "" : "s"}`}
                    text="Communication history helps explain why a task or next step was created."
                    tone="green"
                    onClick={() => setActiveTab("messages")}
                  />
                </div>
              </section>
            </div>
          ) : null}
          {activeTab === "analytics" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Intelligence Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Turn your Student OS data into clear progress signals
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      See how your journey, documents, tasks, university planning and communication are working together,
                      then jump directly to the area that needs attention.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("insights")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Executive Insights
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Journey Overview
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <AnalyticsCommandStat
                    label="Overall Health"
                    value={`${analytics.overallHealth}%`}
                    helper={analytics.overallHealth >= 75 ? "Student OS looks healthy" : "Some areas need attention"}
                    tone={analytics.overallHealth >= 75 ? "green" : "orange"}
                  />
                  <AnalyticsCommandStat
                    label="Journey"
                    value={`${analytics.journeyScore}%`}
                    helper={`${successCenter.stageLabel} stage`}
                    tone="navy"
                  />
                  <AnalyticsCommandStat
                    label="Documents"
                    value={`${analytics.documentReadiness}%`}
                    helper={`${analytics.approvedDocuments} approved of ${documents.length || 0}`}
                    tone="amber"
                  />
                  <AnalyticsCommandStat
                    label="Alert Pressure"
                    value={analytics.notificationPressure}
                    helper="Visible alert signals"
                    tone={analytics.notificationPressure ? "rose" : "green"}
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Readiness Matrix
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        What is helping — and what is holding you back?
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      Live Student OS
                    </span>
                  </div>

                  <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
                    <AnalyticsMetricCard
                      label="Application Readiness"
                      value={readiness.applicationReadiness}
                      text="University planning, tasks and document preparation supporting applications."
                      tone="orange"
                      onClick={() => setActiveTab("applications")}
                    />
                    <AnalyticsMetricCard
                      label="CAS Readiness"
                      value={readiness.casReadiness}
                      text="Offer position, documents and operational preparation supporting CAS."
                      tone="navy"
                      onClick={() => setActiveTab("visa")}
                    />
                    <AnalyticsMetricCard
                      label="Visa Readiness"
                      value={readiness.visaReadiness}
                      text="CAS, supporting documents and current visa preparation signals."
                      tone="violet"
                      onClick={() => setActiveTab("visa")}
                    />
                    <AnalyticsMetricCard
                      label="Task Readiness"
                      value={readiness.taskScore}
                      text="How much of your visible assigned workload is under control."
                      tone="rose"
                      onClick={() => setActiveTab("tasks")}
                    />
                    <AnalyticsMetricCard
                      label="Document Readiness"
                      value={analytics.documentReadiness}
                      text={`${analytics.approvedDocuments} approved of ${documents.length || 0} visible document record(s).`}
                      tone="amber"
                      onClick={() => setActiveTab("documents")}
                    />
                    <AnalyticsMetricCard
                      label="Journey Completion"
                      value={analytics.journeyScore}
                      text="Application, offer, CAS and visa progress combined into one journey signal."
                      tone="green"
                      onClick={() => setActiveTab("roadmap")}
                    />
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Student Health Engine
                      </p>
                      <h3 className="mt-1 text-3xl font-black">
                        {analytics.overallHealth}%
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Combined signal from journey progress, documents, tasks, university planning,
                        communication and alert pressure.
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="h-3 overflow-hidden rounded-full bg-[#edf1f4]">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: String(clampPercent(analytics.overallHealth)) + "%" }}
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <AnalyticsMiniStat
                          label="Tasks"
                          value={`${analytics.taskCompletion}%`}
                          tone="orange"
                        />
                        <AnalyticsMiniStat
                          label="Universities"
                          value={`${analytics.universityPlanning}%`}
                          tone="teal"
                        />
                        <AnalyticsMiniStat
                          label="Communication"
                          value={`${analytics.communicationActivity}%`}
                          tone="sky"
                        />
                        <AnalyticsMiniStat
                          label="Journey"
                          value={`${analytics.journeyScore}%`}
                          tone="navy"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab("actions")}
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>Open What Needs Attention</span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Operational Signals
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        What could slow your journey?
                      </h3>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      <AnalyticsSignalCard
                        label="Overdue Tasks"
                        value={analytics.overdueTasks}
                        helper={analytics.overdueTasks ? "Recover these first" : "No overdue work"}
                        tone={analytics.overdueTasks ? "rose" : "green"}
                      />
                      <AnalyticsSignalCard
                        label="Urgent Alerts"
                        value={urgentNotifications}
                        helper={urgentNotifications ? "Needs quick review" : "No urgent alert"}
                        tone={urgentNotifications ? "rose" : "green"}
                      />
                      <AnalyticsSignalCard
                        label="Warning Alerts"
                        value={warningNotifications}
                        helper={warningNotifications ? "Monitor these signals" : "No warning alert"}
                        tone={warningNotifications ? "orange" : "green"}
                      />
                      <AnalyticsSignalCard
                        label="Portal Sync"
                        value={loadingData ? "Refreshing" : "Ready"}
                        helper="Latest Student OS fetch state"
                        tone={loadingData ? "orange" : "navy"}
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Progress Breakdown
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      See the balance of your whole Student OS
                    </h3>
                  </div>

                  <span className="w-fit rounded-full border border-orange-300 bg-orange-50 px-3 py-1.5 text-[10px] font-black text-orange-700">
                    Student-safe analytics only
                  </span>
                </div>

                <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-4">
                    <AnalyticsProgressRow
                      label="Journey Progress"
                      value={analytics.journeyScore}
                      tone="navy"
                      onClick={() => setActiveTab("roadmap")}
                    />
                    <AnalyticsProgressRow
                      label="Documents"
                      value={analytics.documentReadiness}
                      tone="amber"
                      onClick={() => setActiveTab("documents")}
                    />
                    <AnalyticsProgressRow
                      label="Tasks"
                      value={analytics.taskCompletion}
                      tone="orange"
                      onClick={() => setActiveTab("tasks")}
                    />
                    <AnalyticsProgressRow
                      label="University Planning"
                      value={analytics.universityPlanning}
                      tone="teal"
                      onClick={() => setActiveTab("universities")}
                    />
                    <AnalyticsProgressRow
                      label="Communication"
                      value={analytics.communicationActivity}
                      tone="sky"
                      onClick={() => setActiveTab("messages")}
                    />
                  </div>

                  <div className="rounded-[1.5rem] border-2 border-orange-300 bg-orange-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                          Recommended Focus
                        </p>
                        <h4 className="mt-1 text-xl font-black text-[#17324d]">
                          Your smartest next areas to improve
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-[#607487]">
                          These recommendations use only the data visible inside your Student OS.
                        </p>
                      </div>

                      <span className="w-fit shrink-0 rounded-full border border-orange-300 bg-white/75 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                        {analytics.notificationPressure} alert signal{analytics.notificationPressure === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      {analytics.recommendations?.length ? (
                        analytics.recommendations.map((item, index) => (
                          <AnalyticsRecommendationCard
                            key={`${item.title}-${item.targetTab}-${index}`}
                            item={item}
                            index={index}
                            onOpen={() => setActiveTab(item.targetTab || "overview")}
                          />
                        ))
                      ) : (
                        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
                          <p className="text-sm font-black text-emerald-800">
                            No major recommendation is waiting.
                          </p>
                          <p className="mt-1 text-[11px] leading-5 text-emerald-700/80">
                            Keep monitoring your journey, documents, tasks and deadlines as new records arrive.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <AnalyticsShortcutCard
                  eyebrow="Action Center"
                  title={`${actionCenterItems.length} action${actionCenterItems.length === 1 ? "" : "s"}`}
                  text="Turn analytics into actual work by opening the next required actions."
                  tone="orange"
                  onClick={() => setActiveTab("actions")}
                />
                <AnalyticsShortcutCard
                  eyebrow="Roadmap"
                  title={`${journeyProgress}% complete`}
                  text="See where your analytics sit inside the full student journey."
                  tone="navy"
                  onClick={() => setActiveTab("roadmap")}
                />
                <AnalyticsShortcutCard
                  eyebrow="Executive Insights"
                  title="Smart guidance"
                  text="Open the student-safe intelligence layer for deeper operational insight."
                  tone="violet"
                  onClick={() => setActiveTab("insights")}
                />
                <AnalyticsShortcutCard
                  eyebrow="Notifications"
                  title={`${notifications.length || 0} alert${notifications.length === 1 ? "" : "s"}`}
                  text="Review alerts that may explain lower readiness or health scores."
                  tone="pink"
                  onClick={() => setActiveTab("notifications")}
                />
              </section>
            </div>
          ) : null}
          {activeTab === "insights" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Executive Intelligence
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Understand the bigger picture behind your Student OS
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Executive Insights turns your visible journey data into simple signals about progress,
                      readiness, risk and the next area that deserves attention.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("analytics")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Analytics
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("actions")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Action Center
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <ExecutiveCommandStat
                    label="Journey Stage"
                    value={successCenter.stageLabel}
                    helper={`${journeyProgress}% journey complete`}
                    tone="navy"
                  />
                  <ExecutiveCommandStat
                    label="Document Readiness"
                    value={`${readiness.documentScore}%`}
                    helper={`${analytics.approvedDocuments} approved document${analytics.approvedDocuments === 1 ? "" : "s"}`}
                    tone="amber"
                  />
                  <ExecutiveCommandStat
                    label="Task Health"
                    value={overdueTasks.length ? `${overdueTasks.length} overdue` : "On Track"}
                    helper={`${summary.pendingTasksCount || 0} pending task${summary.pendingTasksCount === 1 ? "" : "s"}`}
                    tone={overdueTasks.length ? "rose" : "green"}
                  />
                  <ExecutiveCommandStat
                    label="University Plan"
                    value={`${summary.universitiesCount || 0} option${summary.universitiesCount === 1 ? "" : "s"}`}
                    helper={`${applications.length} live application${applications.length === 1 ? "" : "s"}`}
                    tone="violet"
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Executive Signal Board
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        The strongest signals from your current case
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                      {executiveSignals.length} signal{executiveSignals.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
                    {executiveSignals.map((item, index) => (
                      <ExecutiveSignalCard
                        key={`${item.title}-${index}`}
                        item={item}
                        index={index}
                      />
                    ))}
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Executive Health Summary
                      </p>
                      <h3 className="mt-1 text-3xl font-black">
                        {analytics.overallHealth}%
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Your combined student health score across journey, documents, tasks,
                        university planning, communication and alerts.
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="h-3 overflow-hidden rounded-full bg-[#edf1f4]">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: String(clampPercent(analytics.overallHealth)) + "%" }}
                        />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <ExecutiveMiniStat
                          label="Journey"
                          value={`${analytics.journeyScore}%`}
                          tone="navy"
                        />
                        <ExecutiveMiniStat
                          label="Documents"
                          value={`${analytics.documentReadiness}%`}
                          tone="amber"
                        />
                        <ExecutiveMiniStat
                          label="Tasks"
                          value={`${analytics.taskCompletion}%`}
                          tone="orange"
                        />
                        <ExecutiveMiniStat
                          label="Communication"
                          value={`${analytics.communicationActivity}%`}
                          tone="sky"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab("analytics")}
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>Open Full Analytics</span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Risk Watch
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        Signals that can slow your progress
                      </h3>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      <ExecutiveRiskCard
                        label="Overdue Tasks"
                        value={analytics.overdueTasks}
                        helper={analytics.overdueTasks ? "Needs recovery" : "No overdue work"}
                        tone={analytics.overdueTasks ? "rose" : "green"}
                      />
                      <ExecutiveRiskCard
                        label="Urgent Alerts"
                        value={urgentNotifications}
                        helper={urgentNotifications ? "Needs quick review" : "No urgent alert"}
                        tone={urgentNotifications ? "rose" : "green"}
                      />
                      <ExecutiveRiskCard
                        label="Document Gap"
                        value={`${Math.max(0, 100 - readiness.documentScore)}%`}
                        helper={readiness.documentScore >= 75 ? "Document position is healthy" : "Document readiness can improve"}
                        tone={readiness.documentScore >= 75 ? "green" : "amber"}
                      />
                      <ExecutiveRiskCard
                        label="Visa Gap"
                        value={`${Math.max(0, 100 - readiness.visaReadiness)}%`}
                        helper={readiness.visaReadiness >= 75 ? "Visa readiness is healthy" : "Visa preparation needs work"}
                        tone={readiness.visaReadiness >= 75 ? "green" : "violet"}
                      />
                    </div>
                  </section>
                </div>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Smart Priority Map
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Where should you focus next?
                    </h3>
                  </div>

                  <span className="w-fit rounded-full border border-orange-300 bg-orange-50 px-3 py-1.5 text-[10px] font-black text-orange-700">
                    Student-safe guidance
                  </span>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
                  <ExecutivePriorityCard
                    rank="01"
                    title="Clear urgent work"
                    value={`${actionCenterItems.filter((item) => item.priority === "urgent").length} urgent`}
                    text="Handle urgent tasks and deadlines before lower-priority work."
                    tone="rose"
                    onClick={() => setActiveTab("actions")}
                  />
                  <ExecutivePriorityCard
                    rank="02"
                    title="Protect documents"
                    value={`${readiness.documentScore}% ready`}
                    text="Fix missing, rejected or pending document issues that can block applications and visa stages."
                    tone="amber"
                    onClick={() => setActiveTab("documents")}
                  />
                  <ExecutivePriorityCard
                    rank="03"
                    title="Move applications"
                    value={formatStatus(summary.applicationStatus)}
                    text="Review university and application progress so planning turns into real movement."
                    tone="orange"
                    onClick={() => setActiveTab("applications")}
                  />
                  <ExecutivePriorityCard
                    rank="04"
                    title="Stay connected"
                    value={`${communications.length} message${communications.length === 1 ? "" : "s"}`}
                    text="Use counselor guidance when a next step is unclear instead of guessing."
                    tone="violet"
                    onClick={() => setActiveTab("counselor")}
                  />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ExecutiveShortcutCard
                  eyebrow="Analytics"
                  title={`${analytics.overallHealth}% health`}
                  text="Open the detailed readiness and progress analytics behind these executive signals."
                  tone="navy"
                  onClick={() => setActiveTab("analytics")}
                />
                <ExecutiveShortcutCard
                  eyebrow="Action Center"
                  title={`${actionCenterItems.length} action${actionCenterItems.length === 1 ? "" : "s"}`}
                  text="Turn insights into concrete work by opening the Student Action Center."
                  tone="orange"
                  onClick={() => setActiveTab("actions")}
                />
                <ExecutiveShortcutCard
                  eyebrow="Timeline"
                  title={`${timeline.length} event${timeline.length === 1 ? "" : "s"}`}
                  text="See the history behind the signals and understand how your case changed."
                  tone="sky"
                  onClick={() => setActiveTab("timeline")}
                />
                <ExecutiveShortcutCard
                  eyebrow="Notifications"
                  title={`${notifications.length || 0} alert${notifications.length === 1 ? "" : "s"}`}
                  text="Review alerts that may explain a risk or readiness gap."
                  tone="pink"
                  onClick={() => setActiveTab("notifications")}
                />
              </section>

              <section className="rounded-[1.6rem] border-2 border-sky-200 bg-sky-50 p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                  Student Intelligence Boundary
                </p>
                <h3 className="mt-1 text-lg font-black text-[#17324d]">
                  Executive Insights only uses student-safe portal information
                </h3>
                <p className="mt-2 max-w-5xl text-sm leading-6 text-[#607487]">
                  Private Admin notes, internal staff controls and restricted operational data remain outside this view.
                  Student OS only surfaces the insights that are appropriate for the student to see.
                </p>
              </section>
            </div>
          ) : null}
          {activeTab === "notifications" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Notification Command
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      See what changed — and what actually needs your attention
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Alerts, messages, document updates, task reminders and application signals stay together here,
                      with direct routes back to the right Student OS workspace.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("actions")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      Action Center
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("timeline")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Timeline
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <NotificationCommandStat
                    label="Total Notifications"
                    value={notifications.length}
                    helper="All visible Student OS alerts"
                    tone="navy"
                  />
                  <NotificationCommandStat
                    label="Urgent"
                    value={urgentNotifications}
                    helper={urgentNotifications ? "Needs quick review" : "No urgent alert"}
                    tone={urgentNotifications ? "rose" : "green"}
                  />
                  <NotificationCommandStat
                    label="Warnings"
                    value={warningNotifications}
                    helper={warningNotifications ? "Monitor these updates" : "No warning signal"}
                    tone={warningNotifications ? "orange" : "green"}
                  />
                  <NotificationCommandStat
                    label="Messages"
                    value={communications.length}
                    helper="Communication records visible"
                    tone="violet"
                  />
                </div>
              </section>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                      Notification Filters
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Focus only on the updates you need
                    </h3>
                  </div>
                  <span className="w-fit rounded-full border border-[#9eb6c9] bg-[#edf4f8] px-3 py-1.5 text-[10px] font-black text-[#173f69]">
                    Showing {filteredNotifications.length} of {notifications.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5 p-4 sm:p-5">
                  {notificationFilters.map(([id, label, count]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setNotificationFilter(id)}
                      className={
                        "rounded-xl border-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.11em] transition " +
                        (notificationFilter === id
                          ? "border-[#173f69] bg-[#173f69] text-white shadow-sm"
                          : "border-[#d8b892] bg-[#fffaf4] text-[#526b7f] hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700")
                      }
                    >
                      {label} {Number(count) ? "(" + count + ")" : ""}
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                      Notification Feed
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Prioritised updates with direct actions
                    </h3>
                  </div>

                  <div className="space-y-4 p-4 sm:p-5">
                    {filteredNotifications.length ? (
                      filteredNotifications.map((item, index) => (
                        <PremiumStudentNotificationCard
                          key={item.id || `${item.created_at}-${index}`}
                          item={item}
                          index={index}
                          onOpen={() => goToNotificationTarget(item)}
                        />
                      ))
                    ) : (
                      <div className="rounded-[1.6rem] border-2 border-dashed border-emerald-300 bg-emerald-50 p-6 sm:p-7">
                        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-emerald-700">
                          Clear Filter
                        </p>
                        <h4 className="mt-2 text-2xl font-black text-[#17324d]">
                          No notification matches this filter
                        </h4>
                        <p className="mt-3 text-sm leading-6 text-[#607487]">
                          Try another filter or return to All to see every visible Student OS notification.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="space-y-5">
                  <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                    <div className="bg-[#173f69] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Notification Intelligence
                      </p>
                      <h3 className="mt-1 text-2xl font-black">
                        {urgentNotifications
                          ? urgentNotifications + " urgent update" + (urgentNotifications === 1 ? "" : "s")
                          : "No urgent update right now"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Use notifications as a signal layer, then open the actual workspace where the task,
                        document, application or message belongs.
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3">
                        <NotificationMiniStat label="Urgent" value={urgentNotifications} tone="rose" />
                        <NotificationMiniStat label="Warnings" value={warningNotifications} tone="orange" />
                        <NotificationMiniStat label="Messages" value={communications.length} tone="violet" />
                        <NotificationMiniStat label="Total" value={notifications.length} tone="navy" />
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab("actions")}
                        className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600"
                      >
                        <span>Open What Needs Action</span>
                        <span>→</span>
                      </button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-[1.75rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                    <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Alert Breakdown
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[#17324d]">
                        Where are your notifications coming from?
                      </h3>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      {notificationFilters
                        .filter(([id]) => id !== "all")
                        .slice(0, 8)
                        .map(([id, label, count]) => (
                          <NotificationBreakdownCard
                            key={id}
                            label={label}
                            value={Number(count) || 0}
                          />
                        ))}
                    </div>
                  </section>
                </div>
              </div>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <NotificationShortcutCard
                  eyebrow="Action Center"
                  title={`${actionCenterItems.length} action${actionCenterItems.length === 1 ? "" : "s"}`}
                  text="Open the work behind urgent alerts instead of treating notifications as the task itself."
                  tone="orange"
                  onClick={() => setActiveTab("actions")}
                />
                <NotificationShortcutCard
                  eyebrow="Messages"
                  title={`${communications.length} record${communications.length === 1 ? "" : "s"}`}
                  text="Check communication updates and counselor guidance connected to your case."
                  tone="violet"
                  onClick={() => setActiveTab("messages")}
                />
                <NotificationShortcutCard
                  eyebrow="Timeline"
                  title={`${timeline.length} event${timeline.length === 1 ? "" : "s"}`}
                  text="See the operational history behind notifications and status changes."
                  tone="sky"
                  onClick={() => setActiveTab("timeline")}
                />
                <NotificationShortcutCard
                  eyebrow="Settings"
                  title="Notification controls"
                  text="Review portal preferences and access settings from one place."
                  tone="navy"
                  onClick={() => setActiveTab("settings")}
                />
              </section>
            </div>
          ) : null}
          {activeTab === "settings" ? (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-[0_18px_48px_rgba(23,63,105,0.10)]">
                <div className="flex flex-col gap-4 border-b-[3px] border-orange-500 bg-[#173f69] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      Student Portal Control Center
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      Your account, security and portal connection in one place
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                      Review how you are signed in, which student record is connected, what Student OS data is visible,
                      and the security controls available to your account.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("profile")}
                      className="rounded-xl border border-orange-300/45 bg-orange-400/15 px-4 py-2.5 text-xs font-black text-orange-100 transition hover:bg-orange-400/25"
                    >
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("connections")}
                      className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      Zaifan Team Bridge
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 bg-[#fff9f2] p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
                  <SettingsCommandStat
                    label="Account"
                    value={sessionMode === "account" ? "Secure Login" : "Legacy Access"}
                    helper={account?.is_active === false ? "Account inactive" : "Access active"}
                    tone="green"
                  />
                  <SettingsCommandStat
                    label="Linked Record"
                    value={formatStatus(summary.studentType) + " #" + (summary.studentId || "N/A")}
                    helper="Student OS identity"
                    tone="orange"
                  />
                  <SettingsCommandStat
                    label="Portal Sync"
                    value={loadingData ? "Syncing" : "Ready"}
                    helper="Latest visible Student OS data"
                    tone={loadingData ? "orange" : "navy"}
                  />
                  <SettingsCommandStat
                    label="Portal Health"
                    value={String(analytics.overallHealth) + "%"}
                    helper="Overall Student OS health"
                    tone={analytics.overallHealth >= 75 ? "green" : "violet"}
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-gradient-to-r from-[#fff1df] via-[#fff7ed] to-[#fffdf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                        Account & Identity
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        Your Student OS access details
                      </h3>
                    </div>

                    <span className="w-fit rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.11em] text-emerald-700">
                      {account?.is_active === false ? "Inactive" : "Active"}
                    </span>
                  </div>

                  <div className="grid gap-3 p-4 sm:p-5 sm:grid-cols-2">
                    <SettingsInfoCard
                      label="Student Name"
                      value={summary.studentName || "Not set"}
                      tone="navy"
                    />
                    <SettingsInfoCard
                      label="Portal Email"
                      value={account?.email || summary.email || "Legacy session"}
                      tone="sky"
                    />
                    <SettingsInfoCard
                      label="Login Mode"
                      value={sessionMode === "account" ? "Email + Password" : "Legacy Lookup"}
                      tone="orange"
                    />
                    <SettingsInfoCard
                      label="Linked Record"
                      value={formatStatus(summary.studentType) + " #" + (summary.studentId || "N/A")}
                      tone="violet"
                    />
                  </div>

                  <div className="px-4 pb-5 sm:px-5">
                    <div className="rounded-[1.35rem] border-2 border-sky-200 bg-sky-50 p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-sky-700">
                        How your portal works
                      </p>
                      <p className="mt-2 text-[12px] leading-6 text-[#607487]">
                        Your Student Portal reads portal-safe information connected to this linked student record.
                        Admin-only notes and restricted staff controls stay outside the student view.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-[#173f69] bg-[#fffdf8] shadow-sm">
                  <div className="bg-[#173f69] p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                      Security Status
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      {sessionMode === "account" ? "Protected Account Session" : "Legacy Migration Session"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {sessionMode === "account"
                        ? "Your portal is using the dedicated account login flow."
                        : "You are currently using legacy lookup while portal-account migration continues."}
                    </p>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <SettingsSecurityCard
                      label="Access Type"
                      value={sessionMode === "account" ? "Verified portal account" : "Legacy lookup session"}
                      tone="navy"
                    />
                    <SettingsSecurityCard
                      label="Account State"
                      value={account?.is_active === false ? "Inactive" : "Active"}
                      tone={account?.is_active === false ? "rose" : "green"}
                    />
                    <SettingsSecurityCard
                      label="Internal Admin Notes"
                      value="Hidden"
                      tone="violet"
                    />
                    <SettingsSecurityCard
                      label="Portal Data"
                      value={loadingData ? "Refreshing" : "Loaded"}
                      tone={loadingData ? "orange" : "sky"}
                    />
                  </div>

                  <div className="px-5 pb-5">
                    <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
                        Security reminder
                      </p>
                      <p className="mt-2 text-[11px] leading-5 text-[#607487]">
                        Keep your login details private and sign out on shared devices. Zaifan staff should never need your password.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Portal Visibility
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      What your Student OS currently exposes to you
                    </h3>
                  </div>

                  <span className="w-fit rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.11em] text-emerald-700">
                    Live portal-safe data
                  </span>
                </div>

                <div className="grid gap-4 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <SettingsVisibilityCard
                    label="Applications"
                    value={summary.applicationStatus ? formatStatus(summary.applicationStatus) : "Visible"}
                    helper={String(applications.length) + " application record(s)"}
                    tone="orange"
                    onClick={() => setActiveTab("applications")}
                  />
                  <SettingsVisibilityCard
                    label="Documents"
                    value={String(summary.documentsCount || 0) + " visible"}
                    helper="Document review data"
                    tone="amber"
                    onClick={() => setActiveTab("documents")}
                  />
                  <SettingsVisibilityCard
                    label="Tasks"
                    value={String(summary.tasksCount || 0) + " visible"}
                    helper="Assigned student work"
                    tone="rose"
                    onClick={() => setActiveTab("tasks")}
                  />
                  <SettingsVisibilityCard
                    label="Universities"
                    value={String(summary.universitiesCount || 0) + " visible"}
                    helper="Shortlist and planning"
                    tone="teal"
                    onClick={() => setActiveTab("universities")}
                  />
                  <SettingsVisibilityCard
                    label="Messages"
                    value={String(summary.communicationsCount || 0) + " visible"}
                    helper="Counselor-safe communication"
                    tone="violet"
                    onClick={() => setActiveTab("messages")}
                  />
                  <SettingsVisibilityCard
                    label="Timeline"
                    value={String(summary.timelineCount || 0) + " visible"}
                    helper="Journey activity history"
                    tone="sky"
                    onClick={() => setActiveTab("timeline")}
                  />
                  <SettingsVisibilityCard
                    label="Notifications"
                    value={String(notifications.length || 0) + " visible"}
                    helper="Student alerts and updates"
                    tone="pink"
                    onClick={() => setActiveTab("notifications")}
                  />
                  <SettingsVisibilityCard
                    label="Analytics"
                    value={String(analytics.overallHealth) + "% health"}
                    helper="Student-safe progress signals"
                    tone="navy"
                    onClick={() => setActiveTab("analytics")}
                  />
                </div>
              </section>

              <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                      Password & Access
                    </p>
                    <h3 className="mt-1 text-xl font-black text-[#17324d]">
                      Update your portal password
                    </h3>
                    <p className="mt-2 text-[12px] leading-5 text-[#607487]">
                      Password change is available when your dedicated Student Portal account is active.
                    </p>
                  </div>

                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-3 p-5">
                    <SettingsPasswordField
                      label="Current Password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                      placeholder="Enter current password"
                      disabled={sessionMode !== "account"}
                    />

                    <SettingsPasswordField
                      label="New Password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      placeholder="Create new password"
                      disabled={sessionMode !== "account"}
                    />

                    <SettingsPasswordField
                      label="Confirm New Password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      placeholder="Repeat new password"
                      disabled={sessionMode !== "account"}
                    />

                    {passwordStatus.message ? (
                      <div
                        className={
                          "rounded-xl border-2 p-3 text-sm font-semibold " +
                          (passwordStatus.type === "success"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : passwordStatus.type === "info"
                            ? "border-sky-300 bg-sky-50 text-sky-700"
                            : "border-orange-300 bg-orange-50 text-orange-700")
                        }
                      >
                        {passwordStatus.message}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={passwordStatus.loading || sessionMode !== "account"}
                      className="flex w-full items-center justify-between rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      <span>{passwordStatus.loading ? "Updating Password..." : "Update Password"}</span>
                      <span>→</span>
                    </button>

                    <div className="rounded-xl border-2 border-[#dbe5ec] bg-[#f7fafc] p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">
                        Current Password Access
                      </p>
                      <p className="mt-2 text-[11px] leading-5 text-[#607487]">
                        {sessionMode === "account"
                          ? "Dedicated account login is active. Password updates use the StudentPortalPage password-change action."
                          : "Legacy lookup is active. Password change will unlock after migration to a dedicated account login."}
                      </p>
                    </div>
                  </form>
                </section>

                <section className="overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-[#ead9c5] bg-[#fff7ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-orange-600">
                        Portal Health & Connection
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17324d]">
                        Your Student OS connection at a glance
                      </h3>
                    </div>

                    <span
                      className={
                        "w-fit rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.11em] " +
                        (loadingData
                          ? "border-orange-300 bg-orange-50 text-orange-700"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700")
                      }
                    >
                      {loadingData ? "Syncing" : "Connected"}
                    </span>
                  </div>

                  <div className="grid gap-4 p-4 sm:p-5 sm:grid-cols-2">
                    <SettingsHealthCard
                      label="Account"
                      value={account?.is_active === false ? "Inactive" : "Active"}
                      helper={sessionMode === "account" ? "Dedicated portal account" : "Legacy migration access"}
                      tone={account?.is_active === false ? "rose" : "green"}
                    />
                    <SettingsHealthCard
                      label="Notifications"
                      value={notifications.length}
                      helper="Visible Student OS alerts"
                      tone="orange"
                    />
                    <SettingsHealthCard
                      label="Journey Progress"
                      value={String(journeyProgress) + "%"}
                      helper={successCenter.stageLabel}
                      tone="navy"
                    />
                    <SettingsHealthCard
                      label="Team Bridge"
                      value="Connected"
                      helper="Admin + Counselor + Student workflow"
                      tone="sky"
                    />
                  </div>

                  <div className="px-4 pb-5 sm:px-5">
                    <div className="rounded-[1.35rem] border-2 border-[#173f69] bg-[#173f69] p-5 text-white">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
                        Zaifan Student OS Protection
                      </p>
                      <h4 className="mt-2 text-lg font-black">
                        One student record. Controlled visibility.
                      </h4>
                      <p className="mt-2 text-[12px] leading-6 text-white/70">
                        Applications, documents, tasks, universities, communication, timeline events and notifications
                        remain connected to the same student journey while sensitive staff-only data stays protected.
                      </p>

                      <button
                        type="button"
                        onClick={() => setActiveTab("connections")}
                        className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-black text-white transition hover:bg-white/15"
                      >
                        <span>Open Zaifan Team Bridge</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SettingsShortcutCard
                  eyebrow="Profile"
                  title={summary.studentName || "Student Profile"}
                  text="Review your identity, journey status and student record details."
                  tone="navy"
                  onClick={() => setActiveTab("profile")}
                />
                <SettingsShortcutCard
                  eyebrow="Notifications"
                  title={String(notifications.length || 0) + " alerts"}
                  text="Open your notification center and review updates requiring attention."
                  tone="pink"
                  onClick={() => setActiveTab("notifications")}
                />
                <SettingsShortcutCard
                  eyebrow="Support"
                  title={String(supportAnalytics.open || 0) + " open"}
                  text="Use Student Support when an account or journey issue needs help."
                  tone="violet"
                  onClick={() => setActiveTab("support")}
                />
                <SettingsShortcutCard
                  eyebrow="Team Bridge"
                  title="Connected"
                  text="See how Student OS connects with Zaifan Admin and Counselor operations."
                  tone="sky"
                  onClick={() => setActiveTab("connections")}
                />
              </section>
            </div>
          ) : null}

        </main>
      </div>
    </section>
  );
}









function HeroIdentityCard({ label, value, helper }) {
  return (
    <div className="rounded-[1.15rem] border border-white/15 bg-white/10 p-3.5">
      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-white/55">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-white">{value}</p>
      <p className="mt-1 text-[9px] font-semibold text-white/50">{helper}</p>
    </div>
  );
}

function HeroPulseTile({ label, value, helper, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#a9bfd0] bg-[#edf4f8] text-[#173f69]",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={"rounded-[1.15rem] border-2 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md " + (tones[tone] || tones.navy)}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.14em] opacity-60">{label}</p>
      <p className="mt-1 break-words text-lg font-black">{value}</p>
      <p className="mt-1 truncate text-[8px] font-semibold opacity-65">{helper}</p>
    </button>
  );
}


function HeroCommandMini({ label, value }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/55">{label}</p>
      <p className="mt-1 break-words text-lg font-black text-white">{value}</p>
    </div>
  );
}

function StudentTopKpi({ label, value, helper, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#7fa3bd] bg-[#eaf3f8] text-[#123b5d]",
    sky: "border-sky-300 bg-sky-50 text-sky-900",
    amber: "border-amber-300 bg-amber-50 text-amber-900",
    orange: "border-orange-300 bg-orange-50 text-orange-900",
    rose: "border-rose-300 bg-rose-50 text-rose-900",
    violet: "border-violet-300 bg-violet-50 text-violet-900",
    green: "border-emerald-300 bg-emerald-50 text-emerald-900",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={"group min-h-[108px] rounded-[1.35rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md " + (tones[tone] || tones.navy)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
        <span className="text-sm font-black opacity-45 transition group-hover:translate-x-0.5">→</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-black leading-none">{value}</p>
        <p className="max-w-[110px] text-right text-[8px] font-semibold leading-4 opacity-65">{helper}</p>
      </div>
      <div className="mt-3 h-[3px] w-8 rounded-full bg-current opacity-75" />
    </button>
  );
}

function SimpleStudentNavButton({
  id,
  label,
  tone = "slate",
  active = false,
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#a9bfd0] bg-[#edf4f8] text-[#173f69] hover:bg-[#e1edf4]",
    orange: "border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100",
    amber: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    emerald: "border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100",
    pink: "border-pink-300 bg-pink-50 text-pink-800 hover:bg-pink-100",
    sky: "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100",
    violet: "border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100",
    gold: "border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100",
    slate: "border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100",
    cyan: "border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100",
    purple: "border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100",
    peach: "border-orange-200 bg-[#fff3e8] text-[#a64a13] hover:bg-[#ffe8d4]",
    coral: "border-rose-300 bg-[#fff0ec] text-[#a84d2e] hover:bg-[#ffe2da]",
    teal: "border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100",
    rose: "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100",
    fuchsia: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-800 hover:bg-fuchsia-100",
    indigo: "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
    orangeSoft: "border-orange-300 bg-[#fff4ec] text-orange-800 hover:bg-[#ffe9da]",
    pinkSoft: "border-pink-300 bg-[#fff1f7] text-pink-800 hover:bg-[#ffe2ef]",
    settings: "border-orange-500 bg-orange-500 text-white hover:bg-orange-600",
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-xl border-2 px-4 py-2.5 text-[12px] font-black tracking-[0.04em] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-[#173f69] bg-[#173f69] text-white"
          : tones[tone] || tones.slate
      }`}
    >
      {label}
    </button>
  );
}

function NavHeroStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-white/15 bg-white/10 text-white",
    orange: "border-orange-300/35 bg-orange-400/15 text-orange-100",
    rose: "border-rose-300/30 bg-rose-400/15 text-rose-100",
    green: "border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
  };

  return (
    <div className={`rounded-xl border px-3 py-3 text-center ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] opacity-65">{label}</p>
      <p className="mt-1 text-xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[8px] font-semibold opacity-60">{helper}</p>
    </div>
  );
}

function StudentWorkspaceLauncher({
  id,
  kicker,
  title,
  value,
  description,
  tone = "navy",
  active = false,
  onClick = () => {},
}) {
  const palettes = {
    navy: "border-[#173f69] bg-[#f1f6fa]",
    orange: "border-orange-500 bg-[#fff4ea]",
    amber: "border-amber-400 bg-amber-50",
    rose: "border-rose-400 bg-rose-50",
    green: "border-emerald-400 bg-emerald-50",
    violet: "border-violet-400 bg-violet-50",
    gold: "border-yellow-400 bg-yellow-50",
    pink: "border-pink-400 bg-pink-50",
    sky: "border-sky-400 bg-sky-50",
    blue: "border-blue-400 bg-blue-50",
    teal: "border-teal-400 bg-teal-50",
    red: "border-red-400 bg-red-50",
    emerald: "border-emerald-400 bg-emerald-50",
    purple: "border-purple-400 bg-purple-50",
    indigo: "border-indigo-400 bg-indigo-50",
    cyan: "border-cyan-400 bg-cyan-50",
    slate: "border-slate-300 bg-slate-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[210px] flex-col rounded-[1.5rem] border-[3px] p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
        active
          ? "border-[#173f69] bg-[#173f69] text-white"
          : palettes[tone] || palettes.navy
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.17em] ${
              active ? "text-orange-300" : "text-[#607487]"
            }`}
          >
            {kicker}
          </p>

          <p className={`mt-2 break-words text-2xl font-black leading-tight ${
            active ? "text-white" : "text-[#102b4c]"
          }`}>
            {value}
          </p>

          <h3 className={`mt-1 text-lg font-black ${
            active ? "text-white" : "text-[#17324d]"
          }`}>
            {title}
          </h3>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-lg font-black transition group-hover:translate-x-0.5 ${
            active
              ? "border-white/25 bg-white/10 text-orange-300"
              : "border-[#c9d6e0] bg-white/75 text-[#173f69]"
          }`}
        >
          ↗
        </span>
      </div>

      <p
        className={`mt-3 line-clamp-3 text-[12px] font-medium leading-5 ${
          active ? "text-white/70" : "text-[#526b7f]"
        }`}
      >
        {description}
      </p>

      <div className="mt-auto pt-4">
        <span
          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] ${
            active
              ? "bg-orange-500 text-white"
              : "bg-[#173f69] text-white"
          }`}
        >
          <span>{active ? "Workspace Open" : "Open Workspace"}</span>
          <span>↗</span>
        </span>
      </div>
    </button>
  );
}

function NavSummaryStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-xl border-2 px-3 py-3 text-center shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 text-2xl font-black leading-none">{value || 0}</p>
    </div>
  );
}

function PrimaryStudentNavCard({
  id,
  label,
  meta,
  tone = "navy",
  active = false,
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    gold: "border-yellow-300 bg-yellow-50 text-yellow-800",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-2xl border-2 p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-[#173f69] bg-[#173f69] text-white"
          : tones[tone] || tones.navy
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black">{label}</span>
        <span className={`text-base font-black transition group-hover:translate-x-0.5 ${
          active ? "text-orange-300" : "opacity-55"
        }`}>
          →
        </span>
      </div>
      <p className={`mt-2 text-[11px] font-semibold leading-5 ${
        active ? "text-white/70" : "opacity-65"
      }`}>
        {meta}
      </p>
    </button>
  );
}

function StudentNavSection({
  title,
  subtitle,
  tone = "navy",
  items = [],
  activeTab,
  onSelect = () => {},
}) {
  const tones = {
    navy: {
      shell: "border-[#9eb6c9] bg-[#eef4f8]",
      title: "text-[#173f69]",
      accent: "bg-[#173f69]",
    },
    orange: {
      shell: "border-orange-300 bg-orange-50/80",
      title: "text-orange-800",
      accent: "bg-orange-500",
    },
    violet: {
      shell: "border-violet-300 bg-violet-50/80",
      title: "text-violet-800",
      accent: "bg-violet-500",
    },
    green: {
      shell: "border-emerald-300 bg-emerald-50/80",
      title: "text-emerald-800",
      accent: "bg-emerald-500",
    },
  };

  const toneData = tones[tone] || tones.navy;

  return (
    <section className={`rounded-[1.3rem] border-2 p-3 ${toneData.shell}`}>
      <div className="flex items-center gap-3 px-1 pb-3">
        <span className={`h-9 w-1.5 rounded-full ${toneData.accent}`} />
        <div>
          <h4 className={`text-base font-black ${toneData.title}`}>{title}</h4>
          <p className="mt-0.5 text-[11px] font-semibold text-[#718494]">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map(([id, label, meta]) => {
          const active = activeTab === id;

          return (
            <button
              key={`${title}-${id}-${label}`}
              type="button"
              onClick={() => onSelect(id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                active
                  ? "border-[#173f69] bg-[#173f69] text-white"
                  : "border-white bg-white text-[#17324d] hover:border-orange-300"
              }`}
            >
              <span className="min-w-0">
                <span className="block text-[12px] font-black">{label}</span>
                <span className={`mt-1 block truncate text-[10px] font-semibold ${
                  active ? "text-white/65" : "text-[#81919d]"
                }`}>
                  {meta}
                </span>
              </span>
              <span className={`text-sm font-black ${active ? "text-orange-300" : "text-[#91a2af]"}`}>→</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StudentNavGroup({
  eyebrow,
  title,
  tone = "navy",
  items = [],
  activeTab,
  onSelect = () => {},
}) {
  const tones = {
    navy: {
      shell: "border-[#9fb6c9] bg-[#f5f8fb]",
      accent: "border-[#173f69]",
      icon: "bg-[#eef5f9] text-[#173f69] border-[#a7bfd2]",
      eyebrow: "text-[#607487]",
    },
    orange: {
      shell: "border-orange-300 bg-[#fff6eb]",
      accent: "border-orange-500",
      icon: "bg-orange-500 text-white border-orange-500",
      eyebrow: "text-orange-600",
    },
    violet: {
      shell: "border-violet-300 bg-violet-50/70",
      accent: "border-violet-500",
      icon: "bg-violet-100 text-violet-700 border-violet-300",
      eyebrow: "text-violet-600",
    },
    green: {
      shell: "border-emerald-300 bg-emerald-50/65",
      accent: "border-emerald-500",
      icon: "bg-emerald-100 text-emerald-700 border-emerald-300",
      eyebrow: "text-emerald-600",
    },
  };

  const toneData = tones[tone] || tones.navy;

  return (
    <section
      className={`overflow-hidden rounded-[1.45rem] border-2 border-t-[5px] p-3 shadow-sm ${toneData.shell} ${toneData.accent}`}
    >
      <div className="flex items-start gap-3 px-1 pb-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black ${toneData.icon}`}
        >
          {title.charAt(0)}
        </div>

        <div className="min-w-0">
          <p className={`text-[8px] font-black uppercase tracking-[0.18em] ${toneData.eyebrow}`}>
            {eyebrow}
          </p>
          <h3 className="mt-0.5 truncate text-sm font-black text-[#17324d]">
            {title}
          </h3>
        </div>
      </div>

      <div className="space-y-2">
        {items.map(([id, label, meta]) => {
          const active = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`group flex w-full items-center justify-between gap-3 rounded-xl border-2 px-3 py-2.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                active
                  ? "border-[#173f69] bg-[#173f69] text-white"
                  : "border-[#c8d6e1] bg-white/90 text-[#17324d] hover:border-orange-400 hover:bg-orange-50"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-black">{label}</span>
                <span
                  className={`mt-0.5 block truncate text-[8px] font-semibold ${
                    active ? "text-white/65" : "text-[#8393a0]"
                  }`}
                >
                  {meta}
                </span>
              </span>

              <span
                className={`shrink-0 text-sm font-black transition group-hover:translate-x-0.5 ${
                  active ? "text-orange-300" : "text-[#8ca0b1]"
                }`}
              >
                →
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StudentWorkspaceTab({
  id,
  label,
  active = false,
  onClick = () => {},
  badge = null,
}) {
  const palettes = {
    overview: {
      idle: "border-[#c5d3df] bg-[#f3f7fb] text-[#17324d]",
      active: "border-[#17324d] bg-[#17324d] text-white",
    },
    applications: {
      idle: "border-emerald-200 bg-emerald-50 text-emerald-800",
      active: "border-emerald-600 bg-emerald-600 text-white",
    },
    documents: {
      idle: "border-amber-200 bg-amber-50 text-amber-800",
      active: "border-amber-500 bg-amber-500 text-white",
    },
    tasks: {
      idle: "border-orange-200 bg-orange-50 text-orange-800",
      active: "border-orange-500 bg-orange-500 text-white",
    },
    universities: {
      idle: "border-teal-200 bg-teal-50 text-teal-800",
      active: "border-teal-600 bg-teal-600 text-white",
    },
    visa: {
      idle: "border-violet-200 bg-violet-50 text-violet-800",
      active: "border-violet-600 bg-violet-600 text-white",
    },
    payments: {
      idle: "border-yellow-200 bg-yellow-50 text-yellow-800",
      active: "border-yellow-500 bg-yellow-500 text-white",
    },
    support: {
      idle: "border-rose-200 bg-rose-50 text-rose-800",
      active: "border-rose-500 bg-rose-500 text-white",
    },
    messages: {
      idle: "border-pink-200 bg-pink-50 text-pink-800",
      active: "border-pink-500 bg-pink-500 text-white",
    },
    counselor: {
      idle: "border-sky-200 bg-sky-50 text-sky-800",
      active: "border-sky-600 bg-sky-600 text-white",
    },
  };

  const palette = palettes[id] || palettes.overview;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-xl border-2 px-3 py-2.5 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active ? palette.active : palette.idle
      }`}
    >
      <span>{label}</span>
      {Number(badge) > 0 ? (
        <span
          className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] ${
            active ? "bg-white/20 text-white" : "bg-white/80 text-[#607487]"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function getStudentSecondaryTabClass(id = "") {
  const palettes = {
    actions: "border-orange-200 bg-orange-50 text-orange-800",
    deadlines: "border-rose-200 bg-rose-50 text-rose-800",
    roadmap: "border-emerald-200 bg-emerald-50 text-emerald-800",
    success: "border-teal-200 bg-teal-50 text-teal-800",
    timeline: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
    analytics: "border-violet-200 bg-violet-50 text-violet-800",
    insights: "border-indigo-200 bg-indigo-50 text-indigo-800",
    notifications: "border-pink-200 bg-pink-50 text-pink-800",
    connections: "border-sky-200 bg-sky-50 text-sky-800",
    profile: "border-slate-200 bg-slate-50 text-slate-800",
    settings: "border-orange-200 bg-[#fff4e8] text-orange-800",
  };

  return palettes[id] || "border-[#d8b892] bg-[#fff8ef] text-[#17324d]";
}

function MiniPulse({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb5c8] bg-[#eef4f8] text-[#173f69]",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.14em] opacity-65">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  );
}


function OverviewCommandStat({
  label,
  value,
  helper,
  tone = "navy",
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.25rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">
        {helper}
      </p>
    </button>
  );
}

function OverviewIdentityCard({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#a9bfd0] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    violet: "border-violet-300 bg-violet-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  return (
    <div className={`rounded-xl border-2 p-3.5 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#7a8d9d]">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-black text-[#17324d]">
        {value}
      </p>
    </div>
  );
}

function PremiumReadinessRow({
  label,
  value,
  tone = "navy",
  action = () => {},
}) {
  const score = clampPercent(value);
  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    green: "bg-emerald-500",
  };

  return (
    <button
      type="button"
      onClick={action}
      className="block w-full rounded-xl border border-transparent p-1 text-left transition hover:border-[#e9d3bd] hover:bg-[#fff9f2]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#526b7f]">{label}</span>
        <span className="text-xs font-black text-[#17324d]">{score}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div
          className={`h-full rounded-full transition-all ${bars[tone] || bars.navy}`}
          style={{ width: String(score) + "%" }}
        />
      </div>
    </button>
  );
}

function PremiumStageCard({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.15em] opacity-65">
        {label}
      </p>
      <p className="mt-2 text-sm font-black">{value}</p>
    </div>
  );
}

function PremiumPriorityCard({
  eyebrow,
  title,
  text,
  status,
  tone = "navy",
  actionLabel,
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[220px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">
          {eyebrow}
        </p>
        <span className="rounded-full border border-white/80 bg-white/75 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-[#607487]">
          {status}
        </span>
      </div>

      <h4 className="mt-3 text-2xl font-black tracking-tight text-[#17324d]">
        {title}
      </h4>

      <p className="mt-2 text-[12px] leading-5 text-[#607487]">
        {text}
      </p>

      <div className="mt-auto pt-4">
        <span className="flex items-center justify-between rounded-xl bg-[#173f69] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white transition group-hover:bg-orange-500">
          <span>{actionLabel}</span>
          <span>→</span>
        </span>
      </div>
    </button>
  );
}

function OverviewFact({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#a9bdcd] bg-[#f2f7fa]",
    orange: "border-orange-200 bg-orange-50",
    violet: "border-violet-200 bg-violet-50",
    green: "border-emerald-200 bg-emerald-50",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#17324d]">
        {value}
      </p>
    </div>
  );
}

function StudentReadinessLine({ label, value, tone = "navy" }) {
  const score = clampPercent(value);
  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    green: "bg-emerald-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black text-[#607487]">{label}</span>
        <span className="text-[10px] font-black text-[#17324d]">{score}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#edf1f4]">
        <div
          className={`h-full rounded-full ${bars[tone] || bars.navy}`}
          style={{ width: String(score) + "%" }}
        />
      </div>
    </div>
  );
}

function ApplicationPulseStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb5c8] bg-[#eef4f8] text-[#173f69]",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black">{value}</p>
    </div>
  );
}

function StudentHomeCard({
  eyebrow,
  title,
  text,
  action,
  onClick = () => {},
  tone = "navy",
}) {
  const tones = {
    navy: "border-[#9eb5c8] bg-[#f1f6fa]",
    orange: "border-orange-200 bg-orange-50",
    amber: "border-amber-200 bg-amber-50",
    green: "border-emerald-200 bg-emerald-50",
    violet: "border-violet-200 bg-violet-50",
    rose: "border-rose-200 bg-rose-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.17em] text-[#607487]">
        {eyebrow}
      </p>
      <p className="mt-2 text-xl font-black text-[#17324d]">{title}</p>
      <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-[#607487]">
        {text}
      </p>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
        {action} →
      </p>
    </button>
  );
}

function StudentPulseCard({
  label,
  value,
  detail,
  tone = "navy",
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#6b93ae] bg-[#e9f3f8] text-[#123b5d]",
    orange: "border-[#efa267] bg-[#fff0e3] text-[#8d3f14]",
    green: "border-[#65c79e] bg-[#eaf9f1] text-[#20694f]",
    violet: "border-[#a58be2] bg-[#f3efff] text-[#654aa8]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl border-2 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.15em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-xl font-black">{value}</p>
      <p className="mt-1 line-clamp-1 text-[8px] font-semibold opacity-65">
        {detail}
      </p>
      <div className="mt-2 h-1 w-8 rounded-full bg-current opacity-80 transition-all group-hover:w-12" />
    </button>
  );
}

function PortalNavButton({
  id,
  label,
  active = false,
  onClick = () => {},
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-[58px] overflow-hidden rounded-xl border-2 px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        getStudentNavClass(id, active)
      }`}
    >
      <div className="flex h-full flex-col justify-between">
        <span className="text-[8px] font-black uppercase tracking-[0.11em]">
          {label}
        </span>
        <span className="mt-2 text-[7px] font-bold opacity-60">
          {getPrimaryNavCaption(id)}
        </span>
      </div>
    </button>
  );
}

function getPrimaryNavCaption(id = "") {
  const captions = {
    overview: "Your daily snapshot",
    actions: "What to do next",
    applications: "Offers & progress",
    documents: "Files & approvals",
    tasks: "Your checklist",
    visa: "CAS & visa stage",
    support: "Ask Zaifan",
    payments: "Invoices & receipts",
  };

  return captions[id] || "Open workspace";
}

function StudentToolGroup({
  group,
  activeTab,
  onSelect = () => {},
}) {
  const tones = {
    navy: {
      shell: "border-[#6f94ae] bg-[#edf5f9]",
      eyebrow: "text-[#47718d]",
      title: "text-[#123b5d]",
      dot: "bg-[#123b5d]",
    },
    orange: {
      shell: "border-[#efae76] bg-[#fff2e6]",
      eyebrow: "text-[#a9531b]",
      title: "text-[#7d3710]",
      dot: "bg-orange-500",
    },
    violet: {
      shell: "border-[#ae98e6] bg-[#f5f0ff]",
      eyebrow: "text-[#7657b8]",
      title: "text-[#51378f]",
      dot: "bg-[#8064ce]",
    },
    green: {
      shell: "border-[#79cba9] bg-[#ecfaf3]",
      eyebrow: "text-[#347a60]",
      title: "text-[#1e6049]",
      dot: "bg-[#34aa7e]",
    },
  };

  const tone = tones[group.tone] || tones.navy;

  return (
    <section className={`overflow-hidden rounded-[1.35rem] border-2 shadow-sm ${tone.shell}`}>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
          <p className={`text-[8px] font-black uppercase tracking-[0.18em] ${tone.eyebrow}`}>
            {group.eyebrow}
          </p>
        </div>
        <h3 className={`mt-2 text-base font-black ${tone.title}`}>{group.title}</h3>
        <p className="mt-1 text-[9px] leading-4 text-[#64798a]">
          {group.description}
        </p>
      </div>

      <div className="space-y-1 border-t border-black/5 bg-white/55 p-2">
        {group.items.map(([id, label, meta]) => {
          const active = activeTab === id;

          return (
            <button
              key={`${group.id}-${id}`}
              type="button"
              onClick={() => onSelect(id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                active
                  ? "border-[#123b5d] bg-[#123b5d] text-white shadow-sm"
                  : "border-transparent bg-white/70 text-[#123b5d] hover:border-[#d6b08a] hover:bg-white"
              }`}
            >
              <span className="text-[9px] font-black">{label}</span>
              <span className={`max-w-[48%] truncate text-right text-[7px] font-bold ${
                active ? "text-white/65" : "text-[#8a9aa6]"
              }`}>
                {meta}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function getMetricTone(label = "") {
  const key = normalize(label);

  if (key.includes("warning") || key.includes("alert") || key.includes("pending") || key.includes("deadline")) {
    return {
      card: "border-[#f1a65f] bg-[#fff1df]",
      label: "text-[#a94d12]",
      value: "text-[#7f3510]",
      bar: "bg-orange-500",
    };
  }

  if (key.includes("application") || key.includes("journey") || key.includes("team_bridge")) {
    return {
      card: "border-[#4b7595] bg-[#eaf3f8]",
      label: "text-[#345d7b]",
      value: "text-[#123b5d]",
      bar: "bg-[#123b5d]",
    };
  }

  if (key.includes("document") || key.includes("task")) {
    return {
      card: "border-[#e3bd4f] bg-[#fff8dc]",
      label: "text-[#80691a]",
      value: "text-[#5e4d12]",
      bar: "bg-[#e2ad14]",
    };
  }

  if (key.includes("support") || key.includes("message")) {
    return {
      card: "border-[#a58fe8] bg-[#f3efff]",
      label: "text-[#6c55b5]",
      value: "text-[#4f3d91]",
      bar: "bg-[#8066d7]",
    };
  }

  if (key.includes("university") || key.includes("health") || key.includes("visa")) {
    return {
      card: "border-[#65cba5] bg-[#eafaf2]",
      label: "text-[#25785b]",
      value: "text-[#165943]",
      bar: "bg-[#30b987]",
    };
  }

  return {
    card: "border-[#d8b58f] bg-[#fffaf4]",
    label: "text-[#7b6a59]",
    value: "text-[#123b5d]",
    bar: "bg-orange-400",
  };
}

function getJourneyStageTone(title = "", value = "") {
  const key = `${normalize(title)} ${normalize(value)}`;

  if (key.includes("visa")) {
    return {
      card: "border-[#8267cf] bg-[#f2efff]",
      label: "text-[#6a52b5]",
      value: "text-[#46357f]",
      corner: "bg-[#dcd4ff]/70",
    };
  }

  if (key.includes("cas")) {
    return {
      card: "border-[#49b895] bg-[#e9faf4]",
      label: "text-[#287a61]",
      value: "text-[#165b47]",
      corner: "bg-[#c9f2e4]/70",
    };
  }

  if (key.includes("offer")) {
    return {
      card: "border-[#f0a35e] bg-[#fff1df]",
      label: "text-[#a65318]",
      value: "text-[#7e3910]",
      corner: "bg-[#ffd7ae]/70",
    };
  }

  return {
    card: "border-[#315f82] bg-[#e8f2f8]",
    label: "text-[#315f82]",
    value: "text-[#123b5d]",
    corner: "bg-[#cfe2ee]/80",
  };
}

function getStudentNavClass(id, active) {
  if (active) {
    return "border-[#123b5d] bg-[#123b5d] text-white shadow-[0_8px_18px_rgba(18,59,93,0.18)]";
  }

  const toneMap = {
    overview: "border-[#7aa8c7] bg-[#eaf4fa] text-[#205b80] hover:bg-[#dceef8]",
    actions: "border-[#f4b06e] bg-[#fff1df] text-[#a44a10] hover:bg-[#ffe5c7]",
    deadlines: "border-[#e1bd4c] bg-[#fff8d9] text-[#735d10] hover:bg-[#fff2bb]",
    roadmap: "border-[#6cc5a4] bg-[#eaf9f2] text-[#246c54] hover:bg-[#d9f4e8]",
    success: "border-[#68cfa0] bg-[#ebfbf3] text-[#1d7555] hover:bg-[#d9f6e9]",
    counselor: "border-[#df9fc2] bg-[#fff0f7] text-[#9a356d] hover:bg-[#ffe0ef]",
    connections: "border-[#6c92b0] bg-[#edf5f9] text-[#315f82] hover:bg-[#deedf5]",
    support: "border-[#b495e8] bg-[#f5efff] text-[#704fb2] hover:bg-[#ece1ff]",
    payments: "border-[#e5bc55] bg-[#fff8df] text-[#806219] hover:bg-[#ffefbd]",
    profile: "border-[#b8c4cf] bg-[#f3f6f8] text-[#526779] hover:bg-[#e9eff3]",
    applications: "border-[#63b7dd] bg-[#e9f7fc] text-[#18719a] hover:bg-[#d6f0fa]",
    visa: "border-[#9b82dc] bg-[#f3efff] text-[#664ca8] hover:bg-[#e7dfff]",
    documents: "border-[#efb064] bg-[#fff2e4] text-[#a55318] hover:bg-[#ffe5cc]",
    tasks: "border-[#e8a376] bg-[#fff0e8] text-[#9c4d2c] hover:bg-[#ffe2d5]",
    universities: "border-[#6fd6a5] bg-[#eafbf3] text-[#207552] hover:bg-[#d7f7e7]",
    messages: "border-[#ef9ac4] bg-[#fff0f7] text-[#a22e6a] hover:bg-[#ffdfef]",
    timeline: "border-[#c08de0] bg-[#f8efff] text-[#7c43a2] hover:bg-[#efdfff]",
    analytics: "border-[#a38be5] bg-[#f4f0ff] text-[#664db0] hover:bg-[#e8e0ff]",
    insights: "border-[#ef9c6a] bg-[#fff0e7] text-[#a4491f] hover:bg-[#ffe0d0]",
    notifications: "border-[#ef9bbf] bg-[#fff0f6] text-[#9d3864] hover:bg-[#ffdfec]",
    settings: "border-[#f27b35] bg-[#ffede2] text-[#a6410c] hover:bg-[#ffdbc5]",
  };

  return toneMap[id] || "border-[#d8b58f] bg-[#fffaf4] text-[#675849] hover:bg-[#fff0df]";
}

function QuickLaunchCard({ label, value, onOpen = () => {} }) {
  const tone = getMetricTone(label);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group rounded-2xl border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone.card}`}
    >
      <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${tone.label}`}>
        {label}
      </p>
      <p className={`mt-2 line-clamp-2 text-sm font-black ${tone.value}`}>
        {value || "Open"}
      </p>
      <div className={`mt-3 h-1 w-10 rounded-full transition-all group-hover:w-16 ${tone.bar}`} />
    </button>
  );
}

function StatusCard({ title, value }) {
  const tone = getJourneyStageTone(title, value);

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 p-5 shadow-sm ${tone.card}`}>
      <div className={`absolute right-0 top-0 h-20 w-20 rounded-bl-[3rem] ${tone.corner}`} />
      <p className={`relative text-[10px] font-black uppercase tracking-[0.2em] ${tone.label}`}>
        {title}
      </p>
      <p className={`relative mt-3 text-xl font-black ${tone.value}`}>
        {formatStatus(value)}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper = "",
  warning = false,
  onClick,
  active = false,
}) {
  const tone = warning ? getMetricTone("warning") : getMetricTone(label);
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-[1.25rem] border-2 p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${tone.card} ${
        onClick ? "hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md" : ""
      } ${active ? "ring-2 ring-orange-300" : ""}`}
    >
      <p className={`text-[9px] font-black uppercase tracking-[0.17em] ${tone.label}`}>
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className={`text-2xl font-black tracking-tight ${tone.value}`}>{value || 0}</p>
        {helper ? (
          <p className="max-w-[105px] text-right text-[9px] font-semibold leading-4 text-[#607487]">
            {helper}
          </p>
        ) : null}
      </div>
      <div className={`mt-3 h-1 w-8 rounded-full ${tone.bar}`} />
    </Component>
  );
}

function Panel({ title, children }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border-2 border-[#d8b58f] bg-[#fffaf4] shadow-[0_14px_40px_rgba(16,47,77,0.07)]">
      <div className="border-b border-[#e8c9aa] bg-[#123b5d] px-6 py-4">
        <h2 className="text-lg font-black text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#fffaf4] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-950/35">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950/75">
        {value || "Not added"}
      </p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#fffaf4] p-5 text-sm text-slate-950/40">
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
    <div className="h-full rounded-2xl border border-slate-200 bg-[#fffaf4] p-5">
      <h3 className="break-words font-black text-slate-950">{title}</h3>

      <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-950/45">
        {description || "No extra details."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {meta
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <span
              key={`${label}-${value}`}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-950/45"
            >
              {label}: {value}
            </span>
          ))}
      </div>
    </div>
  );
}























function SettingsCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={"rounded-[1.25rem] border-2 p-4 shadow-sm " + (tones[tone] || tones.navy)}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function SettingsInfoCard({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    violet: "border-violet-300 bg-violet-50",
    sky: "border-sky-300 bg-sky-50",
  };

  return (
    <div className={"rounded-[1.25rem] border-2 p-4 " + (tones[tone] || tones.navy)}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
      <p className="mt-2 break-words text-sm font-black leading-5 text-[#17324d]">{value}</p>
    </div>
  );
}

function SettingsSecurityCard({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    green: "border-emerald-300 bg-emerald-50",
    rose: "border-rose-300 bg-rose-50",
    violet: "border-violet-300 bg-violet-50",
    orange: "border-orange-300 bg-orange-50",
    sky: "border-sky-300 bg-sky-50",
  };

  return (
    <div className={"rounded-xl border-2 p-4 " + (tones[tone] || tones.navy)}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
      <p className="mt-2 break-words text-sm font-black text-[#17324d]">{value}</p>
    </div>
  );
}

function SettingsVisibilityCard({ label, value, helper, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    teal: "border-teal-300 bg-teal-50",
    violet: "border-violet-300 bg-violet-50",
    sky: "border-sky-300 bg-sky-50",
    pink: "border-pink-300 bg-pink-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={"group rounded-[1.3rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md " + (tones[tone] || tones.navy)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
          <p className="mt-2 break-words text-lg font-black text-[#17324d]">{value}</p>
        </div>
        <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">→</span>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-[#607487]">{helper}</p>
    </button>
  );
}

function SettingsPasswordField({ label, value, onChange, placeholder, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border-2 border-[#cbd8e2] bg-[#fbfdfe] px-4 py-3 text-sm text-[#17324d] outline-none transition placeholder:text-[#93a3af] focus:border-orange-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}

function SettingsHealthCard({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    green: "border-emerald-300 bg-emerald-50",
    rose: "border-rose-300 bg-rose-50",
    sky: "border-sky-300 bg-sky-50",
  };

  return (
    <div className={"rounded-[1.25rem] border-2 p-4 " + (tones[tone] || tones.navy)}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
      <p className="mt-2 break-words text-xl font-black text-[#17324d]">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#607487]">{helper}</p>
    </div>
  );
}

function SettingsShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    pink: "border-pink-300 bg-pink-50",
    violet: "border-violet-300 bg-violet-50",
    sky: "border-sky-300 bg-sky-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={"group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md " + (tones[tone] || tones.navy)}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function NotificationCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={"rounded-[1.25rem] border-2 p-4 shadow-sm " + (tones[tone] || tones.navy)}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function PremiumStudentNotificationCard({ item, index = 0, onOpen = () => {} }) {
  const priority = normalize(item?.priority || item?.severity || item?.type || "info");
  const category = normalize(item?.category || item?.type || "");
  const urgent = priority.includes("urgent") || priority.includes("critical");
  const warning = priority.includes("warning") || priority.includes("high");
  const messageLike = category.includes("message") || category.includes("communication");

  const shell = urgent
    ? "border-rose-300 bg-rose-50"
    : warning
    ? "border-orange-300 bg-orange-50"
    : messageLike
    ? "border-violet-300 bg-violet-50"
    : "border-sky-300 bg-sky-50";

  const badge = urgent
    ? "bg-rose-500"
    : warning
    ? "bg-orange-500"
    : messageLike
    ? "bg-violet-600"
    : "bg-sky-600";

  return (
    <article className={"rounded-[1.45rem] border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md " + shell}>
      <div className="flex gap-3">
        <div className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white " + badge}>
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] text-[#607487]">
                  {formatStatus(item?.priority || item?.severity || "notification")}
                </span>
                <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] text-[#607487]">
                  {formatStatus(item?.category || item?.type || "update")}
                </span>
              </div>

              <h4 className="mt-3 break-words text-lg font-black text-[#17324d]">
                {item?.title || "Student Notification"}
              </h4>
              <p className="mt-2 text-[12px] leading-6 text-[#607487]">
                {item?.message || item?.description || item?.body || "Student OS update"}
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-white/80 bg-white/75 px-3 py-2 text-right">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">Date</p>
              <p className="mt-1 text-[11px] font-black text-[#17324d]">
                {formatDate(item?.created_at || item?.date)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:border-orange-500 hover:bg-orange-500"
          >
            <span>Open Related Workspace</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function NotificationMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={"rounded-xl border-2 p-3 " + (tones[tone] || tones.navy)}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function NotificationBreakdownCard({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-[#e1e8ed] bg-[#fbfdfe] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#17324d]">{value}</p>
    </div>
  );
}

function NotificationShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    violet: "border-violet-300 bg-violet-50",
    sky: "border-sky-300 bg-sky-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={"group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md " + (tones[tone] || tones.navy)}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function ExecutiveCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function ExecutiveSignalCard({ item, index = 0 }) {
  const tones = [
    "border-orange-300 bg-orange-50",
    "border-amber-300 bg-amber-50",
    "border-sky-300 bg-sky-50",
    "border-violet-300 bg-violet-50",
  ];

  const badges = [
    "bg-orange-500",
    "bg-amber-500",
    "bg-sky-600",
    "bg-violet-600",
  ];

  const toneIndex = index % tones.length;

  return (
    <article className={`rounded-[1.4rem] border-2 p-4 shadow-sm ${tones[toneIndex]}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${badges[toneIndex]}`}>
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#607487]">
            {item?.title || "Executive Signal"}
          </p>
          <p className="mt-2 break-words text-2xl font-black text-[#17324d]">
            {item?.value || "—"}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-[#607487]">
            {item?.note || "Student-safe operational signal."}
          </p>
        </div>
      </div>
    </article>
  );
}

function ExecutiveMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    sky: "border-sky-300 bg-sky-50 text-sky-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 break-words text-lg font-black">{value}</p>
    </div>
  );
}

function ExecutiveRiskCard({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
      <p className="mt-2 break-words text-xl font-black text-[#17324d]">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#607487]">{helper}</p>
    </div>
  );
}

function ExecutivePriorityCard({ rank, title, value, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    violet: "border-violet-300 bg-violet-50",
  };

  const badges = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[220px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white ${badges[tone] || badges.navy}`}>
          {rank}
        </span>
        <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">→</span>
      </div>

      <p className="mt-4 text-[9px] font-black uppercase tracking-[0.15em] text-[#607487]">{title}</p>
      <p className="mt-2 text-xl font-black text-[#17324d]">{value}</p>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
    </button>
  );
}

function ExecutiveShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    sky: "border-sky-300 bg-sky-50",
    pink: "border-pink-300 bg-pink-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function AnalyticsCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function AnalyticsMetricCard({ label, value, text, tone = "navy", onClick = () => {} }) {
  const score = clampPercent(value);

  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    violet: "bg-violet-600",
    rose: "bg-rose-500",
    green: "bg-emerald-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#607487]">{label}</p>
          <p className="mt-2 text-3xl font-black text-[#17324d]">{score}%</p>
        </div>
        <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">→</span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full rounded-full ${bars[tone] || bars.navy}`}
          style={{ width: String(score) + "%" }}
        />
      </div>

      <p className="mt-3 text-[11px] leading-5 text-[#607487]">{text}</p>
    </button>
  );
}

function AnalyticsMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    teal: "border-teal-300 bg-teal-50 text-teal-800",
    sky: "border-sky-300 bg-sky-50 text-sky-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 break-words text-lg font-black">{value}</p>
    </div>
  );
}

function AnalyticsSignalCard({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    green: "border-emerald-300 bg-emerald-50",
    rose: "border-rose-300 bg-rose-50",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
      <p className="mt-2 break-words text-xl font-black text-[#17324d]">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#607487]">{helper}</p>
    </div>
  );
}

function AnalyticsProgressRow({ label, value, tone = "navy", onClick = () => {} }) {
  const score = clampPercent(value);
  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    teal: "bg-teal-600",
    sky: "bg-sky-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-xl border-2 border-[#e1e8ed] bg-[#fbfdfe] p-4 text-left transition hover:border-orange-300 hover:bg-orange-50"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#526b7f]">{label}</span>
        <span className="text-xs font-black text-[#17324d]">{score}%</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div className={`h-full rounded-full ${bars[tone] || bars.navy}`} style={{ width: String(score) + "%" }} />
      </div>
      <div className="mt-2 flex justify-end">
        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">Open →</span>
      </div>
    </button>
  );
}

function AnalyticsRecommendationCard({ item, index = 0, onOpen = () => {} }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full gap-3 rounded-[1.25rem] border-2 border-white bg-white/75 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-xs font-black text-white">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-[#17324d]">
              {item?.title || "Recommended action"}
            </h4>
            <p className="mt-1 text-[11px] leading-5 text-[#607487]">
              {item?.note || item?.description || "Open the related workspace to continue."}
            </p>
          </div>
          <span className="shrink-0 text-sm font-black text-orange-700">→</span>
        </div>
      </div>
    </button>
  );
}

function AnalyticsShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    violet: "border-violet-300 bg-violet-50",
    pink: "border-pink-300 bg-pink-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function TimelineCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function PremiumTimelineEvent({ event, index = 0 }) {
  const action = normalize(`${event?.action_type || ""} ${event?.title || ""}`);
  const isTask = action.includes("task");
  const isMessage = action.includes("message") || action.includes("whatsapp");
  const isApplication = action.includes("application");
  const isDocument = action.includes("document");

  const shell = isTask
    ? "border-orange-300 bg-orange-50"
    : isMessage
    ? "border-emerald-300 bg-emerald-50"
    : isApplication
    ? "border-sky-300 bg-sky-50"
    : isDocument
    ? "border-violet-300 bg-violet-50"
    : "border-[#cbd8e2] bg-[#f7fafc]";

  const dot = isTask
    ? "bg-orange-500"
    : isMessage
    ? "bg-emerald-600"
    : isApplication
    ? "bg-sky-600"
    : isDocument
    ? "bg-violet-600"
    : "bg-[#173f69]";

  return (
    <article className="relative sm:pl-14">
      <div className={`absolute left-[8px] top-5 hidden h-7 w-7 items-center justify-center rounded-full border-4 border-[#fffdf8] text-[9px] font-black text-white shadow-sm sm:flex ${dot}`}>
        {index + 1}
      </div>

      <div className={`rounded-[1.45rem] border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${shell}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] text-[#607487]">
                {formatStatus(event?.action_type || "activity")}
              </span>
              <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] text-[#607487]">
                {event?.created_by_name || "Zaifan Team"}
              </span>
            </div>

            <h4 className="mt-3 break-words text-lg font-black text-[#17324d]">
              {event?.title || formatStatus(event?.action_type) || "Timeline Event"}
            </h4>

            <p className="mt-2 whitespace-pre-line text-[12px] leading-6 text-[#607487]">
              {event?.description ||
                event?.new_value ||
                event?.old_value ||
                "Journey activity recorded."}
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-white/80 bg-white/75 px-3 py-2 text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">
              Event Date
            </p>
            <p className="mt-1 text-[11px] font-black text-[#17324d]">
              {formatDate(event?.created_at)}
            </p>
          </div>
        </div>

        {(event?.old_value || event?.new_value) ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {event?.old_value ? (
              <TimelineValueBox label="Previous" value={event.old_value} tone="rose" />
            ) : null}
            {event?.new_value ? (
              <TimelineValueBox label="Updated" value={event.new_value} tone="green" />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function TimelineValueBox({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    rose: "border-rose-200 bg-rose-50",
    green: "border-emerald-200 bg-emerald-50",
  };

  return (
    <div className={`rounded-xl border p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">{label}</p>
      <p className="mt-1 break-words text-[11px] font-semibold leading-5 text-[#17324d]">
        {String(value)}
      </p>
    </div>
  );
}

function TimelineMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function TimelineBreakdownCard({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    green: "border-emerald-300 bg-emerald-50",
    sky: "border-sky-300 bg-sky-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#17324d]">{value}</p>
      <p className="mt-1 text-[10px] text-[#607487]">timeline event{value === 1 ? "" : "s"}</p>
    </div>
  );
}

function TimelineConnectionCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${tones[tone] || tones.navy}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function MessageCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function PremiumStudentMessageCard({
  message,
  index = 0,
  onCounselor = () => {},
  onTimeline = () => {},
}) {
  const channel = normalize(message?.channel || message?.type || "message");
  const status = normalize(message?.status || "visible");
  const whatsapp = channel.includes("whatsapp");
  const queued = status.includes("queued") || status.includes("pending") || status.includes("draft");
  const sent = status.includes("sent") || status.includes("delivered") || status.includes("completed");

  const shell = whatsapp
    ? "border-emerald-300 bg-emerald-50"
    : queued
    ? "border-orange-300 bg-orange-50"
    : "border-sky-300 bg-sky-50";

  const badge = whatsapp
    ? "bg-emerald-600"
    : queued
    ? "bg-orange-500"
    : "bg-sky-600";

  return (
    <article className={`rounded-[1.45rem] border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${shell}`}>
      <div className="flex gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${badge}`}>
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] text-[#607487]">
                  {formatStatus(message?.channel || message?.type || "message")}
                </span>
                <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] ${getStatusStyle(message?.status || "visible")}`}>
                  {formatStatus(message?.status || "visible")}
                </span>
              </div>

              <h4 className="mt-3 break-words text-lg font-black text-[#17324d]">
                {message?.subject || `${formatStatus(message?.channel || "Message")} Update`}
              </h4>
              <p className="mt-2 whitespace-pre-line text-[12px] leading-6 text-[#607487]">
                {message?.message || message?.body || message?.notes || "Message record"}
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-white/80 bg-white/75 px-3 py-2 text-right">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">
                Created
              </p>
              <p className="mt-1 text-[11px] font-black text-[#17324d]">
                {formatDate(message?.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <MessageMetaBox
              label="Channel"
              value={formatStatus(message?.channel || message?.type || "message")}
            />
            <MessageMetaBox
              label="Status"
              value={formatStatus(message?.status || "visible")}
            />
            <MessageMetaBox
              label="State"
              value={sent ? "Delivered / Sent" : queued ? "Waiting" : "Visible"}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCounselor}
              className="flex items-center justify-between rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:border-orange-500 hover:bg-orange-500"
            >
              <span>Ask Counselor</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={onTimeline}
              className="flex items-center justify-between rounded-xl border-2 border-sky-300 bg-white/75 px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-sky-800 transition hover:bg-sky-100"
            >
              <span>View Timeline</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function MessageMetaBox({ label, value }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/75 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">{label}</p>
      <p className="mt-1 break-words text-[11px] font-black text-[#17324d]">{value}</p>
    </div>
  );
}

function MessageMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    sky: "border-sky-300 bg-sky-50 text-sky-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function MessageHealthCard({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    pink: "border-pink-300 bg-pink-50",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
      <p className="mt-2 break-words text-lg font-black text-[#17324d]">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#607487]">{helper}</p>
    </div>
  );
}

function MessageReasonCard({ step, title, text, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
  };
  const stepTones = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    violet: "bg-violet-600",
    rose: "bg-rose-500",
  };

  return (
    <div className={`rounded-[1.35rem] border-2 p-4 ${tones[tone] || tones.navy}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white ${stepTones[tone] || stepTones.navy}`}>
        {step}
      </span>
      <h4 className="mt-3 text-base font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
    </div>
  );
}

function MessageShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    violet: "border-violet-300 bg-violet-50",
    sky: "border-sky-300 bg-sky-50",
    pink: "border-pink-300 bg-pink-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${tones[tone] || tones.navy}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function UniversityCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function PremiumUniversityCard({
  university,
  index = 0,
  onApplications = () => {},
  onCounselor = () => {},
}) {
  const status = university?.status || university?.application_status || "planned";
  const category = university?.category || university?.university_type || university?.type || "option";

  return (
    <article className="overflow-hidden rounded-[1.45rem] border-2 border-teal-300 bg-teal-50 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md">
      <div className="flex flex-col gap-4 border-b border-teal-200 bg-white/55 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-sm font-black text-white">
            {index + 1}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-teal-700">
              University Option
            </p>
            <h4 className="mt-1 break-words text-lg font-black text-[#17324d]">
              {university?.university_name || university?.name || "University"}
            </h4>
            <p className="mt-1 text-[12px] leading-5 text-[#607487]">
              {university?.course_name ||
                university?.course ||
                university?.program ||
                "Course information not visible yet"}
            </p>
          </div>
        </div>

        <span className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] ${getStatusStyle(status)}`}>
          {formatStatus(status)}
        </span>
      </div>

      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <UniversityDetailStat label="Country" value={university?.country || "Not set"} tone="navy" />
          <UniversityDetailStat label="Category" value={formatStatus(category)} tone="violet" />
          <UniversityDetailStat label="Intake" value={university?.intake || university?.intake_name || "Not set"} tone="orange" />
          <UniversityDetailStat
            label="Application"
            value={formatStatus(university?.application_status || "not_started")}
            tone="green"
          />
        </div>

        {(university?.notes || university?.reason || university?.fit_notes) ? (
          <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-3.5">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-orange-700">
              Planning Notes
            </p>
            <p className="mt-1 text-[11px] leading-5 text-[#607487]">
              {university?.notes || university?.reason || university?.fit_notes}
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onApplications}
            className="flex items-center justify-between rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:border-orange-500 hover:bg-orange-500"
          >
            <span>Applications</span>
            <span>→</span>
          </button>
          <button
            type="button"
            onClick={onCounselor}
            className="flex items-center justify-between rounded-xl border-2 border-teal-300 bg-white/75 px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-teal-800 transition hover:bg-teal-100"
          >
            <span>Discuss Option</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function UniversityDetailStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function UniversityPlanningStep({ step, title, text, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    teal: "border-teal-300 bg-teal-50",
  };
  const stepTones = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    teal: "bg-teal-600",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black text-white ${stepTones[tone] || stepTones.navy}`}>
        {step}
      </span>
      <p className="mt-3 text-sm font-black text-[#17324d]">{title}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#607487]">{text}</p>
    </div>
  );
}

function UniversityMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    teal: "border-teal-300 bg-teal-50 text-teal-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 break-words text-lg font-black">{value}</p>
    </div>
  );
}

function UniversityReadinessRow({ label, value, tone = "navy" }) {
  const score = clampPercent(value);
  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    teal: "bg-teal-600",
  };

  return (
    <div className="rounded-xl border-2 border-[#e1e8ed] bg-[#fbfdfe] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#526b7f]">{label}</span>
        <span className="text-xs font-black text-[#17324d]">{score}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div className={`h-full rounded-full ${bars[tone] || bars.navy}`} style={{ width: String(score) + "%" }} />
      </div>
    </div>
  );
}

function UniversityDecisionCard({ step, title, text, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    teal: "border-teal-300 bg-teal-50",
  };
  const stepTones = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    teal: "bg-teal-600",
  };

  return (
    <div className={`rounded-[1.35rem] border-2 p-4 ${tones[tone] || tones.navy}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white ${stepTones[tone] || stepTones.navy}`}>
        {step}
      </span>
      <h4 className="mt-3 text-base font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
    </div>
  );
}

function UniversityShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${tones[tone] || tones.navy}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function TaskCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function PremiumStudentTaskCard({
  task,
  index = 0,
  onCounselor = () => {},
  onDeadlines = () => {},
}) {
  const status = normalize(task?.status);
  const priority = normalize(task?.priority);
  const complete = status.includes("done") || status.includes("complete");
  const urgent = priority.includes("urgent") || priority.includes("high");
  const dueAt = task?.due_date ? new Date(task.due_date).getTime() : null;
  const overdue = !complete && dueAt && dueAt < Date.now();

  const shell = complete
    ? "border-emerald-300 bg-emerald-50"
    : overdue
    ? "border-rose-300 bg-rose-50"
    : urgent
    ? "border-orange-300 bg-orange-50"
    : "border-sky-300 bg-sky-50";

  const numberTone = complete
    ? "bg-emerald-600"
    : overdue
    ? "bg-rose-500"
    : urgent
    ? "bg-orange-500"
    : "bg-sky-600";

  return (
    <article className={`rounded-[1.45rem] border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${shell}`}>
      <div className="flex gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${numberTone}`}>
          {complete ? "✓" : index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] ${
                  overdue
                    ? "border-rose-300 bg-white/75 text-rose-700"
                    : urgent
                    ? "border-orange-300 bg-white/75 text-orange-700"
                    : "border-sky-300 bg-white/75 text-sky-700"
                }`}>
                  {overdue ? "Overdue" : formatStatus(task?.priority || "normal")}
                </span>
                <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] ${getStatusStyle(task?.status || "pending")}`}>
                  {formatStatus(task?.status || "pending")}
                </span>
              </div>

              <h4 className="mt-3 break-words text-lg font-black text-[#17324d]">
                {task?.title || "Student Task"}
              </h4>
              <p className="mt-2 text-[12px] leading-5 text-[#607487]">
                {task?.description || task?.notes || "Student task assigned to your journey."}
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-white/80 bg-white/75 px-3 py-2 text-right">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">Due</p>
              <p className={`mt-1 text-[11px] font-black ${overdue ? "text-rose-700" : "text-[#17324d]"}`}>
                {formatDate(task?.due_date)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onDeadlines}
              className="flex items-center justify-between rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-orange-500 hover:border-orange-500"
            >
              <span>Check Deadline</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={onCounselor}
              className="flex items-center justify-between rounded-xl border-2 border-orange-300 bg-white/75 px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-orange-700 transition hover:bg-orange-100"
            >
              <span>Ask Counselor</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function TaskMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function TaskHealthRow({ label, value, tone = "navy" }) {
  const score = clampPercent(value);
  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    green: "bg-emerald-500",
  };

  return (
    <div className="rounded-xl border-2 border-[#e1e8ed] bg-[#fbfdfe] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#526b7f]">{label}</span>
        <span className="text-xs font-black text-[#17324d]">{score}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div className={`h-full rounded-full ${bars[tone] || bars.navy}`} style={{ width: String(score) + "%" }} />
      </div>
    </div>
  );
}

function TaskWorkloadCard({ title, value, text, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  return (
    <div className={`rounded-[1.35rem] border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#607487]">{title}</p>
      <p className="mt-2 text-3xl font-black text-[#17324d]">{value}</p>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
    </div>
  );
}

function TaskShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${tones[tone] || tones.navy}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function DocumentCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function PremiumStudentDocumentCard({
  document,
  index = 0,
  onHelp = () => {},
}) {
  const rawStatus = document?.status || document?.document_status || "pending";
  const status = normalize(rawStatus);
  const approved = status.includes("approved") || status.includes("complete");
  const rejected = status.includes("rejected");
  const missing = status.includes("missing");
  const pending = status.includes("pending") || status.includes("review");

  const shell = approved
    ? "border-emerald-300 bg-emerald-50"
    : rejected
    ? "border-rose-300 bg-rose-50"
    : missing
    ? "border-amber-300 bg-amber-50"
    : "border-sky-300 bg-sky-50";

  const badge = approved
    ? "bg-emerald-600"
    : rejected
    ? "bg-rose-500"
    : missing
    ? "bg-amber-500"
    : "bg-sky-600";

  const fileUrl =
    document?.file_url ||
    document?.public_url ||
    document?.url ||
    document?.download_url ||
    "";

  return (
    <article className={`rounded-[1.45rem] border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${shell}`}>
      <div className="flex gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${badge}`}>
          {approved ? "✓" : index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">
                Student Document
              </p>
              <h4 className="mt-1 break-words text-lg font-black text-[#17324d]">
                {document?.document_name ||
                  document?.file_name ||
                  document?.title ||
                  "Document"}
              </h4>
              <p className="mt-2 text-[12px] leading-5 text-[#607487]">
                {document?.notes ||
                  document?.description ||
                  (rejected
                    ? "This document was rejected and may need correction."
                    : missing
                    ? "This document is marked missing."
                    : pending
                    ? "This document is waiting for review."
                    : approved
                    ? "This document is approved."
                    : "Document status is available from your Zaifan record.")}
              </p>
            </div>

            <span className={`w-fit shrink-0 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] ${getStatusStyle(rawStatus)}`}>
              {formatStatus(rawStatus)}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/80 bg-white/75 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">Uploaded</p>
              <p className="mt-1 text-[11px] font-black text-[#17324d]">
                {formatDate(document?.created_at)}
              </p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/75 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">Last Updated</p>
              <p className="mt-1 text-[11px] font-black text-[#17324d]">
                {formatDate(document?.updated_at || document?.created_at)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-orange-500 hover:border-orange-500"
              >
                <span>Open File</span>
                <span>↗</span>
              </a>
            ) : (
              <div className="flex items-center rounded-xl border-2 border-[#cbd8e2] bg-white/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#81919d]">
                File preview unavailable
              </div>
            )}

            <button
              type="button"
              onClick={onHelp}
              className="flex items-center justify-between rounded-xl border-2 border-orange-300 bg-white/75 px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-orange-700 transition hover:bg-orange-100"
            >
              <span>{rejected || missing ? "Ask About This" : "Document Help"}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function DocumentMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function DocumentHealthRow({ label, value, total, tone = "navy" }) {
  const percentage = total ? clampPercent((value / total) * 100) : 0;
  const bars = {
    green: "bg-emerald-500",
    orange: "bg-orange-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    navy: "bg-[#173f69]",
  };

  return (
    <div className="rounded-xl border-2 border-[#e1e8ed] bg-[#fbfdfe] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#526b7f]">{label}</span>
        <span className="text-xs font-black text-[#17324d]">
          {value} / {total}
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div
          className={`h-full rounded-full ${bars[tone] || bars.navy}`}
          style={{ width: String(percentage) + "%" }}
        />
      </div>
    </div>
  );
}

function DocumentJourneyCard({ step, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  const stepTones = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    green: "bg-emerald-600",
    violet: "bg-violet-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[1.35rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${tones[tone] || tones.navy}`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white ${stepTones[tone] || stepTones.navy}`}>
        {step}
      </span>
      <h4 className="mt-3 text-base font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <div className="mt-4 flex justify-end">
        <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">→</span>
      </div>
    </button>
  );
}

function DocumentShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${tones[tone] || tones.navy}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function VisaCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function VisaJourneyStage({
  step,
  title,
  status,
  text,
  tone = "navy",
  active = false,
  complete = false,
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
  };

  const stepTones = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    green: "bg-emerald-600",
    violet: "bg-violet-600",
    rose: "bg-rose-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-start gap-4 rounded-[1.35rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        active ? "border-orange-500 bg-[#fff1df] ring-2 ring-orange-100" : tones[tone] || tones.navy
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${
        complete ? "bg-emerald-600" : stepTones[tone] || stepTones.navy
      }`}>
        {complete ? "✓" : step}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-base font-black text-[#17324d]">{title}</h4>
            <p className="mt-1 text-[12px] leading-5 text-[#607487]">{text}</p>
          </div>

          <span className={`w-fit shrink-0 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] ${
            complete
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : active
              ? "border-orange-300 bg-orange-50 text-orange-700"
              : "border-white/80 bg-white/75 text-[#607487]"
          }`}>
            {status}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className={`text-[9px] font-black uppercase tracking-[0.11em] ${
            complete ? "text-emerald-700" : active ? "text-orange-700" : "text-[#81919d]"
          }`}>
            {complete ? "Completed" : active ? "Current focus" : "Open stage"}
          </span>
          <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </button>
  );
}

function VisaMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function VisaReadinessRow({ label, value, tone = "navy", onClick = () => {} }) {
  const score = clampPercent(value);
  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-xl border-2 border-transparent p-2 text-left transition hover:border-[#e7d0b9] hover:bg-[#fff9f2]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#526b7f]">{label}</span>
        <span className="text-xs font-black text-[#17324d]">{score}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div className={`h-full rounded-full ${bars[tone] || bars.navy}`} style={{ width: String(score) + "%" }} />
      </div>
      <div className="mt-1.5 flex justify-end">
        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
          Open →
        </span>
      </div>
    </button>
  );
}

function VisaRequirementCard({ title, text, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    green: "border-emerald-300 bg-emerald-50",
    amber: "border-amber-300 bg-amber-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <div className={`rounded-[1.35rem] border-2 p-4 ${tones[tone] || tones.navy}`}>
      <h4 className="text-base font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
    </div>
  );
}

function VisaShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function ApplicationCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function PremiumStudentApplicationCard({
  application,
  index = 0,
  onDocuments = () => {},
  onVisa = () => {},
  onCounselor = () => {},
}) {
  const applicationStatus =
    application?.application_status || application?.status || "not_started";
  const offerStatus = application?.offer_status || "not_started";
  const casStatus = application?.cas_status || application?.cas || "not_started";
  const visaStatus = application?.visa_status || "not_started";

  return (
    <article className="overflow-hidden rounded-[1.5rem] border-2 border-[#cbd8e2] bg-[#fbfdff] shadow-sm transition hover:border-orange-300 hover:shadow-md">
      <div className="flex flex-col gap-4 border-b border-[#dfe7ed] bg-[#f3f8fb] p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#173f69] text-sm font-black text-white">
            {index + 1}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
              Application
            </p>
            <h4 className="mt-1 break-words text-lg font-black text-[#17324d]">
              {application?.university_name ||
                application?.university ||
                application?.institution_name ||
                "University Application"}
            </h4>
            <p className="mt-1 text-[12px] leading-5 text-[#607487]">
              {application?.course_name ||
                application?.course ||
                application?.program ||
                "Course information not visible yet"}
            </p>
          </div>
        </div>

        <span className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] ${getStatusStyle(applicationStatus)}`}>
          {formatStatus(applicationStatus)}
        </span>
      </div>

      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ApplicationStageStat label="Application" value={formatStatus(applicationStatus)} tone="orange" />
          <ApplicationStageStat label="Offer" value={formatStatus(offerStatus)} tone="green" />
          <ApplicationStageStat label="CAS" value={formatStatus(casStatus)} tone="navy" />
          <ApplicationStageStat label="Visa" value={formatStatus(visaStatus)} tone="violet" />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-[#dbe5ec] bg-white p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">Intake</p>
            <p className="mt-1 text-[11px] font-black text-[#17324d]">
              {application?.intake || application?.intake_name || "Not visible"}
            </p>
          </div>
          <div className="rounded-xl border border-[#dbe5ec] bg-white p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">Last Updated</p>
            <p className="mt-1 text-[11px] font-black text-[#17324d]">
              {formatDate(application?.updated_at || application?.created_at)}
            </p>
          </div>
        </div>

        {(application?.next_action || application?.notes) ? (
          <div className="mt-3 rounded-xl border-2 border-orange-200 bg-orange-50 p-3.5">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-orange-700">
              Next / Notes
            </p>
            <p className="mt-1 text-[11px] leading-5 text-[#607487]">
              {application?.next_action || application?.notes}
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={onDocuments}
            className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2.5 text-[10px] font-black text-amber-800 transition hover:bg-amber-100"
          >
            Documents
          </button>
          <button
            type="button"
            onClick={onVisa}
            className="rounded-xl border-2 border-violet-300 bg-violet-50 px-3 py-2.5 text-[10px] font-black text-violet-800 transition hover:bg-violet-100"
          >
            CAS / Visa
          </button>
          <button
            type="button"
            onClick={onCounselor}
            className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-3 py-2.5 text-[10px] font-black text-white transition hover:bg-orange-500 hover:border-orange-500"
          >
            Ask Counselor
          </button>
        </div>
      </div>
    </article>
  );
}

function ApplicationStartStep({ step, title, text, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    teal: "border-teal-300 bg-teal-50",
  };
  const stepTones = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    teal: "bg-teal-600",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black text-white ${stepTones[tone] || stepTones.navy}`}>
        {step}
      </span>
      <p className="mt-3 text-sm font-black text-[#17324d]">{title}</p>
      <p className="mt-1 text-[10px] leading-4 text-[#607487]">{text}</p>
    </div>
  );
}

function ApplicationStageStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function ApplicationReadinessRow({ label, value, tone = "navy", onClick = () => {} }) {
  const score = clampPercent(value);

  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    teal: "bg-teal-600",
  };

  const barClassName = "h-full rounded-full " + (bars[tone] || bars.navy);
  const barStyle = {
    width: String(score) + "%",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-xl border-2 border-transparent p-2 text-left transition hover:border-[#e7d0b9] hover:bg-[#fff9f2]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#526b7f]">{label}</span>
        <span className="text-xs font-black text-[#17324d]">{score}%</span>
      </div>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div className={barClassName} style={barStyle} />
      </div>

      <div className="mt-1.5 flex justify-end">
        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
          Open →
        </span>
      </div>
    </button>
  );
}

function ApplicationJourneyStep({ step, title, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    teal: "border-teal-300 bg-teal-50",
  };
  const stepTones = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    green: "bg-emerald-600",
    violet: "bg-violet-600",
    teal: "bg-teal-600",
  };

  return (
    <div className={`rounded-[1.3rem] border-2 p-4 ${tones[tone] || tones.navy}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-black text-white ${stepTones[tone] || stepTones.navy}`}>
        {step}
      </div>
      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{title}</p>
      <p className="mt-1 break-words text-base font-black text-[#17324d]">{value}</p>
    </div>
  );
}

function ApplicationShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    teal: "border-teal-300 bg-teal-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function ProfileCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function ProfileIdentityCard({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    sky: "border-sky-300 bg-sky-50",
    violet: "border-violet-300 bg-violet-50",
    orange: "border-orange-300 bg-orange-50",
    green: "border-emerald-300 bg-emerald-50",
    amber: "border-amber-300 bg-amber-50",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#738696]">{label}</p>
      <p className="mt-1.5 break-words text-sm font-black text-[#17324d]">{value}</p>
    </div>
  );
}

function ProfileStudyCard({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    teal: "border-teal-300 bg-teal-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <div className={`rounded-[1.3rem] border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#738696]">{label}</p>
      <p className="mt-2 break-words text-lg font-black text-[#17324d]">{value}</p>
      <p className="mt-2 text-[11px] leading-5 text-[#607487]">{helper}</p>
    </div>
  );
}

function ProfileJourneyCard({ step, label, value, helper, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  const stepTones = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    green: "bg-emerald-600",
    violet: "bg-violet-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[1.35rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white ${
          stepTones[tone] || stepTones.navy
        }`}>
          {step}
        </span>
        <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">→</span>
      </div>
      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#17324d]">{value}</p>
      <p className="mt-2 text-[11px] leading-5 text-[#607487]">{helper}</p>
    </button>
  );
}

function ProfileActivityCard({ label, value, helper, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    teal: "border-teal-300 bg-teal-50",
    pink: "border-pink-300 bg-pink-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#17324d]">{value}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-[#607487]">{helper}</span>
        <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">→</span>
      </div>
    </button>
  );
}

function ProfileAccessCard({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    sky: "border-sky-300 bg-sky-50 text-sky-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] opacity-65">{label}</p>
      <p className="mt-1.5 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function PaymentCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function PremiumInvoiceCard({ invoice, index = 0, onUploadReceipt = () => {} }) {
  const status = String(
    invoice?.status || invoice?.payment_status || invoice?.invoice_status || "pending"
  ).toLowerCase();

  const overdue =
    status.includes("overdue") ||
    (invoice?.due_date &&
      new Date(invoice.due_date).getTime() < Date.now() &&
      !["paid", "completed", "settled"].some((item) => status.includes(item)));

  const paid = ["paid", "completed", "settled"].some((item) => status.includes(item));

  return (
    <article
      className={`rounded-[1.4rem] border-2 p-4 shadow-sm ${
        overdue
          ? "border-rose-300 bg-rose-50"
          : paid
          ? "border-emerald-300 bg-emerald-50"
          : "border-orange-300 bg-orange-50"
      }`}
    >
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${
            overdue ? "bg-rose-500" : paid ? "bg-emerald-600" : "bg-orange-500"
          }`}
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#607487]">
                Invoice
              </p>
              <h4 className="mt-1 text-base font-black text-[#17324d]">
                {invoice?.title ||
                  invoice?.invoice_title ||
                  invoice?.invoice_number ||
                  `Invoice #${invoice?.id}`}
              </h4>
              <p className="mt-2 text-[11px] leading-5 text-[#607487]">
                {invoice?.description || invoice?.notes || "Student invoice record"}
              </p>
            </div>

            <div className="shrink-0 sm:text-right">
              <p className="text-xl font-black text-[#17324d]">
                {formatMoney(
                  invoice?.total_amount || invoice?.amount || invoice?.invoice_amount,
                  invoice?.currency || "PKR"
                )}
              </p>
              <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] ${getStatusStyle(
                invoice?.status || invoice?.payment_status || invoice?.invoice_status
              )}`}>
                {formatStatus(
                  invoice?.status ||
                    invoice?.payment_status ||
                    invoice?.invoice_status ||
                    "pending"
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">Due</p>
              <p className="mt-1 text-[11px] font-black text-[#17324d]">
                {formatDate(invoice?.due_date)}
              </p>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/70 px-3 py-2.5">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#81919d]">Created</p>
              <p className="mt-1 text-[11px] font-black text-[#17324d]">
                {formatDate(invoice?.created_at)}
              </p>
            </div>
          </div>

          {!paid ? (
            <button
              type="button"
              onClick={onUploadReceipt}
              className="mt-3 flex w-full items-center justify-between rounded-xl bg-[#173f69] px-4 py-3 text-[10px] font-black uppercase tracking-[0.11em] text-white transition hover:bg-orange-500"
            >
              <span>Use this invoice for receipt</span>
              <span>→</span>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function PaymentMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 break-words text-lg font-black">{value}</p>
    </div>
  );
}

function PaymentRequestCard({ request, index = 0 }) {
  return (
    <div className="rounded-[1.25rem] border-2 border-orange-300 bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-xs font-black text-white">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-[#17324d]">
                {request?.title || "Payment Request"}
              </h4>
              <p className="mt-1 text-[11px] leading-5 text-[#607487]">
                {request?.message || request?.notes || "Zaifan requested a payment action."}
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
              {formatStatus(request?.status || "pending")}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-[#607487]">
            <span className="rounded-lg bg-white/75 px-2.5 py-1.5">
              {formatMoney(request?.amount, request?.currency || "PKR")}
            </span>
            <span className="rounded-lg bg-white/75 px-2.5 py-1.5">
              {formatDate(request?.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentField({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#607487]">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function PaymentAccountCard({ account }) {
  const accountNumber = account?.account_number || account?.mobile_wallet_number || "";
  const iban = account?.iban || "";

  const copyText = async (value) => {
    if (!value || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(String(value));
    } catch {
      // Clipboard access may be unavailable; the visible value remains selectable.
    }
  };

  return (
    <article className="rounded-[1.35rem] border-2 border-emerald-300 bg-emerald-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
            Approved Payment Account
          </p>
          <h4 className="mt-1 text-lg font-black text-[#17324d]">
            {account?.account_title || account?.bank_name || "Zaifan Payment Account"}
          </h4>
          <p className="mt-1 text-[11px] text-[#607487]">
            {account?.instructions || "Use only for the payment instructed by Zaifan."}
          </p>
        </div>
        <span className="rounded-full border border-emerald-300 bg-white/70 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-700">
          Verified
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <PaymentAccountValue label="Type" value={formatStatus(account?.account_type || "account")} />
        <PaymentAccountValue label="Bank / Wallet" value={account?.bank_name || account?.provider || "—"} />
        <PaymentAccountValue label="Account Number" value={accountNumber || "—"} onCopy={accountNumber ? () => copyText(accountNumber) : null} />
        <PaymentAccountValue label="IBAN" value={iban || "—"} onCopy={iban ? () => copyText(iban) : null} />
      </div>
    </article>
  );
}

function PaymentAccountValue({ label, value, onCopy = null }) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/75 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#81919d]">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="min-w-0 break-all text-[11px] font-black text-[#17324d]">{value}</p>
        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 rounded-lg border border-[#cddae3] bg-[#f6fafc] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#173f69] transition hover:border-orange-300 hover:bg-orange-50"
          >
            Copy
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PremiumPaymentHistoryCard({ payment, index = 0 }) {
  return (
    <article className="rounded-[1.3rem] border-2 border-emerald-300 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#17324d]">
                {payment?.reference || payment?.payment_method || payment?.method || "Payment"}
              </p>
              <p className="mt-1 text-[10px] text-[#607487]">
                {formatDate(payment?.paid_at || payment?.payment_date || payment?.created_at)}
              </p>
            </div>
            <p className="text-base font-black text-emerald-700">
              {formatMoney(payment?.amount || payment?.paid_amount, payment?.currency || "PKR")}
            </p>
          </div>
          {payment?.notes ? (
            <p className="mt-2 text-[11px] leading-5 text-[#607487]">{payment.notes}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function PremiumReceiptCard({ receipt, index = 0 }) {
  return (
    <article className="rounded-[1.3rem] border-2 border-sky-300 bg-sky-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-xs font-black text-white">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#17324d]">Payment Receipt</p>
              <p className="mt-1 text-[10px] text-[#607487]">
                {formatDate(receipt?.submitted_at || receipt?.created_at)}
              </p>
            </div>
            <span className={`w-fit rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] ${getStatusStyle(
              receipt?.status || receipt?.review_status || "pending_review"
            )}`}>
              {formatStatus(receipt?.status || receipt?.review_status || "pending_review")}
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <PaymentAccountValue
              label="Amount"
              value={formatMoney(receipt?.amount, receipt?.currency || "PKR")}
            />
            <PaymentAccountValue
              label="Reference"
              value={receipt?.reference || receipt?.payment_reference || "Not added"}
            />
          </div>

          {receipt?.receipt_url ? (
            <a
              href={receipt.receipt_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-xl bg-[#173f69] px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.11em] text-white transition hover:bg-orange-500"
            >
              View Receipt
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function PaymentEmptyState({ title, text, compact = false }) {
  return (
    <div className={`rounded-[1.35rem] border-2 border-dashed border-[#cbd9e3] bg-[#f8fbfd] text-center ${compact ? "p-4" : "p-6"}`}>
      <p className="text-base font-black text-[#17324d]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#607487]">{text}</p>
    </div>
  );
}

function SupportCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    sky: "border-sky-300 bg-sky-50 text-sky-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">
        {helper}
      </p>
    </div>
  );
}

function SupportTypeCard({ item, active = false, onClick = () => {} }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[1.3rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-orange-500 bg-orange-50 ring-2 ring-orange-100"
          : "border-[#d8e2e9] bg-[#f8fbfd] hover:border-orange-300 hover:bg-orange-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-black ${active ? "text-orange-800" : "text-[#17324d]"}`}>
            {item.icon} {item.title}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-[#607487]">
            {item.description}
          </p>
        </div>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
            active
              ? "border-orange-400 bg-orange-500 text-white"
              : "border-[#c9d6e0] bg-white text-[#173f69]"
          }`}
        >
          {active ? "✓" : "→"}
        </span>
      </div>
    </button>
  );
}

function PremiumSupportTimelineItem({ event, index = 0 }) {
  const status = String(event?.status || event?.type || "").toLowerCase();
  const responseLike =
    status.includes("response") ||
    status.includes("resolved") ||
    status.includes("reply");

  return (
    <article
      className={`rounded-[1.3rem] border-2 p-4 ${
        responseLike
          ? "border-emerald-300 bg-emerald-50"
          : "border-sky-300 bg-sky-50"
      }`}
    >
      <div className="flex gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
            responseLike
              ? "bg-emerald-600 text-white"
              : "bg-sky-600 text-white"
          }`}
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <p className="font-black text-[#17324d]">
              {event?.subject || event?.title || "Support activity"}
            </p>
            <span className="text-[10px] font-semibold text-[#8494a1]">
              {formatDate(event?.created_at || event?.date)}
            </span>
          </div>

          <p className="mt-2 text-[11px] leading-5 text-[#607487]">
            {event?.message ||
              event?.description ||
              event?.response ||
              "Support activity updated."}
          </p>
        </div>
      </div>
    </article>
  );
}

function SupportRouteCard({ title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <h4 className="text-sm font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[11px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-3 inline-block text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function PremiumSupportHistoryCard({ request, index = 0 }) {
  const status = String(request?.status || "open").toLowerCase();
  const tones =
    status === "resolved" || status === "closed"
      ? "border-emerald-300 bg-emerald-50"
      : status === "in_progress" || status === "in progress"
      ? "border-violet-300 bg-violet-50"
      : "border-orange-300 bg-orange-50";

  return (
    <article className={`rounded-[1.35rem] border-2 p-4 shadow-sm ${tones}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#173f69] text-xs font-black text-white">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#607487]">
                {formatStatus(request?.request_type || request?.type || "Support")}
              </p>
              <h4 className="mt-1 text-base font-black text-[#17324d]">
                {request?.subject || "Support request"}
              </h4>
            </div>

            <span className="w-fit rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] text-[#607487]">
              {formatStatus(request?.status || "open")}
            </span>
          </div>

          <p className="mt-2 text-[11px] leading-5 text-[#607487]">
            {request?.message || request?.description || "No request details visible."}
          </p>

          <p className="mt-3 text-[10px] font-semibold text-[#8b99a5]">
            {formatDate(request?.created_at)}
          </p>
        </div>
      </div>
    </article>
  );
}

function SupportEmptyState({ title, text }) {
  return (
    <div className="rounded-[1.35rem] border-2 border-dashed border-[#cbd9e3] bg-[#f8fbfd] p-6 text-center">
      <p className="text-base font-black text-[#17324d]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#607487]">
        {text}
      </p>
    </div>
  );
}

function BridgeCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 break-words text-xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function BridgeFlowCard({
  step,
  title,
  status,
  description,
  tone = "navy",
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    violet: "border-violet-300 bg-violet-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  const stepTones = {
    navy: "bg-[#173f69] text-white",
    orange: "bg-orange-500 text-white",
    violet: "bg-violet-600 text-white",
    green: "bg-emerald-600 text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-start gap-4 rounded-[1.35rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
        stepTones[tone] || stepTones.navy
      }`}>
        {step}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-base font-black text-[#17324d]">{title}</h4>
            <p className="mt-1 text-[12px] leading-5 text-[#607487]">{description}</p>
          </div>
          <span className="w-fit shrink-0 rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] text-[#607487]">
            {status}
          </span>
        </div>
        <div className="mt-3 flex justify-end">
          <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </button>
  );
}

function BridgeHealthCard({ label, value, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-3 text-left transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.14em] opacity-65">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </button>
  );
}

function BridgeStudentAction({ title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    violet: "border-violet-300 bg-violet-50",
    green: "border-emerald-300 bg-emerald-50",
    amber: "border-amber-300 bg-amber-50",
    pink: "border-pink-300 bg-pink-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <h4 className="text-sm font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[11px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-3 inline-block text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
        Open →
      </span>
    </button>
  );
}

function BridgeRoleCard({ title, eyebrow, tone = "navy", items = [] }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    violet: "border-violet-300 bg-violet-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  return (
    <div className={`rounded-[1.4rem] border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 rounded-xl border border-white/80 bg-white/70 px-3 py-2.5">
            <span className="mt-0.5 text-orange-600">•</span>
            <span className="text-[11px] font-semibold leading-5 text-[#607487]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CounselorCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    pink: "border-pink-300 bg-pink-50 text-pink-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-black tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">
        {helper}
      </p>
    </div>
  );
}

function CounselorInfoCard({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    sky: "border-sky-300 bg-sky-50",
    green: "border-emerald-300 bg-emerald-50",
    orange: "border-orange-300 bg-orange-50",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#728697]">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-black text-[#17324d]">
        {value}
      </p>
    </div>
  );
}

function CounselorGuidanceCard({
  eyebrow,
  title,
  text,
  tone = "navy",
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[1.35rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#607487]">
        {eyebrow}
      </p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
          Open workspace
        </span>
        <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">
          →
        </span>
      </div>
    </button>
  );
}

function CounselorResponseStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] opacity-65">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-black">{value}</p>
    </div>
  );
}

function CounselorReasonCard({
  number,
  title,
  text,
  tone = "navy",
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    rose: "border-rose-300 bg-rose-50",
    violet: "border-violet-300 bg-violet-50",
  };

  const numberTones = {
    navy: "bg-[#173f69] text-white",
    orange: "bg-orange-500 text-white",
    rose: "bg-rose-500 text-white",
    violet: "bg-violet-600 text-white",
  };

  return (
    <div className={`rounded-[1.35rem] border-2 p-4 ${tones[tone] || tones.navy}`}>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black ${
          numberTones[tone] || numberTones.navy
        }`}
      >
        {number}
      </div>
      <h4 className="mt-3 text-base font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
    </div>
  );
}

function SuccessCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">
        {helper}
      </p>
    </div>
  );
}

function SuccessMilestoneCard({
  title,
  value,
  description,
  tone = "navy",
  complete = false,
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    teal: "border-teal-300 bg-teal-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[1.35rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base font-black text-[#17324d]">{title}</h4>
        <span
          className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
            complete
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-white/80 bg-white/75 text-[#607487]"
          }`}
        >
          {complete ? "Completed" : "In Progress"}
        </span>
      </div>

      <p className="mt-3 text-xl font-black text-[#17324d]">{value}</p>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">
        {description}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
          Open workspace
        </span>
        <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">
          →
        </span>
      </div>
    </button>
  );
}

function SuccessMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.14em] opacity-65">
        {label}
      </p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function SuccessInsightRow({
  label,
  value,
  text,
  tone = "navy",
  onClick = () => {},
}) {
  const score = clampPercent(value);
  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    green: "bg-emerald-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-xl border-2 border-[#e8d6c2] bg-[#fffaf4] p-3 text-left transition hover:border-orange-300 hover:bg-orange-50"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#526b7f]">{label}</span>
        <span className="text-xs font-black text-[#17324d]">{score}%</span>
      </div>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div
          className={`h-full rounded-full ${bars[tone] || bars.navy}`}
          style={{ width: String(score) + "%" }}
        />
      </div>

      <p className="mt-2 text-[11px] leading-5 text-[#607487]">{text}</p>
    </button>
  );
}

function SuccessGuidanceCard({
  eyebrow,
  title,
  text,
  tone = "navy",
  actionLabel,
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[200px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">
        {eyebrow}
      </p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        {actionLabel} →
      </span>
    </button>
  );
}

function RoadmapCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function RoadmapStageCard({
  step,
  title,
  status,
  description,
  tone = "navy",
  active = false,
  complete = false,
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
    teal: "border-teal-300 bg-teal-50",
  };

  const stepTones = {
    navy: "bg-[#173f69] text-white",
    orange: "bg-orange-500 text-white",
    amber: "bg-amber-500 text-white",
    green: "bg-emerald-600 text-white",
    violet: "bg-violet-600 text-white",
    rose: "bg-rose-500 text-white",
    teal: "bg-teal-600 text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-start gap-4 rounded-[1.35rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        active
          ? "border-orange-500 bg-[#fff1df] ring-2 ring-orange-200"
          : tones[tone] || tones.navy
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
        complete ? "bg-emerald-600 text-white" : stepTones[tone] || stepTones.navy
      }`}>
        {complete ? "✓" : step}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-base font-black text-[#17324d]">{title}</h4>
            <p className="mt-1 text-[12px] leading-5 text-[#607487]">{description}</p>
          </div>

          <span className={`w-fit shrink-0 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] ${
            complete
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : active
              ? "border-orange-300 bg-orange-50 text-orange-700"
              : "border-white/80 bg-white/75 text-[#607487]"
          }`}>
            {status}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className={`text-[9px] font-black uppercase tracking-[0.11em] ${
            complete ? "text-emerald-700" : active ? "text-orange-700" : "text-[#81919d]"
          }`}>
            {complete ? "Completed" : active ? "Current focus" : "Open stage"}
          </span>
          <span className="text-sm font-black text-[#173f69] transition group-hover:translate-x-0.5">→</span>
        </div>
      </div>
    </button>
  );
}

function RoadmapMiniStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.14em] opacity-65">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function RoadmapShortcutCard({
  eyebrow,
  title,
  text,
  tone = "navy",
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    violet: "border-violet-300 bg-violet-50",
    teal: "border-teal-300 bg-teal-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[185px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function DeadlineCommandStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">{helper}</p>
    </div>
  );
}

function DeadlineInfoCard({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <div className={`rounded-xl border-2 p-3.5 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.15em] opacity-65">{label}</p>
      <p className="mt-1.5 text-sm font-black">{value}</p>
    </div>
  );
}

function DeadlineReadinessRow({ label, value, tone = "navy", onOpen = () => {} }) {
  const score = clampPercent(value);
  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
    green: "bg-emerald-500",
  };

  return (
    <button type="button" onClick={onOpen} className="block w-full rounded-xl border-2 border-transparent p-2 text-left transition hover:border-[#e7d0b9] hover:bg-[#fff9f2]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#526b7f]">{label}</span>
        <span className="text-xs font-black text-[#17324d]">{score}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div className={`h-full rounded-full ${bars[tone] || bars.navy}`} style={{ width: String(score) + "%" }} />
      </div>
      <div className="mt-1.5 flex justify-end">
        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">Open →</span>
      </div>
    </button>
  );
}

function formatDeadlineDistance(item = {}) {
  const rawDays = Number(item?.daysUntil);
  const days = Number.isFinite(rawDays) ? rawDays : 0;

  if (item?.isOverdue) {
    const overdueDays = Math.abs(days);
    return `${overdueDays || 1} day${overdueDays === 1 ? "" : "s"} overdue`;
  }

  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  if (days > 1) return `${days} days left`;

  return formatDate(item?.date);
}

function PremiumDeadlineQueueItem({ item, index = 0, onOpen = () => {} }) {
  const overdue = Boolean(item.isOverdue);
  const urgent = item.priority === "urgent";
  const shell = overdue ? "border-rose-300 bg-rose-50" : urgent ? "border-orange-300 bg-orange-50" : "border-amber-300 bg-amber-50";
  const number = overdue ? "border-rose-300 bg-rose-500 text-white" : urgent ? "border-orange-300 bg-orange-500 text-white" : "border-amber-300 bg-amber-500 text-white";

  return (
    <article className={`rounded-[1.4rem] border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${shell}`}>
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black ${number}`}>{index + 1}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${overdue ? "border-rose-300 bg-white/75 text-rose-700" : urgent ? "border-orange-300 bg-white/75 text-orange-700" : "border-amber-300 bg-white/75 text-amber-700"}`}>
                  {overdue ? "Overdue" : formatStatus(item.priority)}
                </span>
                <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#607487]">{item.source || "Student OS"}</span>
                <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#607487]">{formatDeadlineDistance(item)}</span>
              </div>
              <h4 className="mt-3 break-words text-base font-black text-[#17324d]">{item.title}</h4>
              <p className="mt-2 text-[12px] leading-5 text-[#607487]">{item.message}</p>
            </div>
            <p className="shrink-0 text-[10px] font-semibold text-[#8a99a6]">{formatDate(item.date)}</p>
          </div>
          <button type="button" onClick={onOpen} className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#173f69] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange-500">
            <span>{item.action || "Open Workspace"}</span><span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function DeadlineShortcutCard({ eyebrow, title, text, tone = "navy", onClick = () => {} }) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <button type="button" onClick={onClick} className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">{eyebrow}</p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">{title}</h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">{text}</p>
      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">Open workspace →</span>
    </button>
  );
}

function ActionCommandStat({
  label,
  value,
  helper,
  tone = "navy",
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8] text-[#173f69]",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-semibold leading-5 opacity-70">
        {helper}
      </p>
    </div>
  );
}

function ActionPriorityBadge({ priority = "normal" }) {
  const styles = {
    urgent: "border-rose-300 bg-rose-50 text-rose-700",
    important: "border-orange-300 bg-orange-50 text-orange-700",
    normal: "border-sky-300 bg-sky-50 text-sky-700",
    success: "border-emerald-300 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full border-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.13em] ${
        styles[priority] || styles.normal
      }`}
    >
      {formatStatus(priority)}
    </span>
  );
}

function ActionReadinessRow({
  label,
  value,
  tone = "navy",
  onOpen = () => {},
}) {
  const score = clampPercent(value);
  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
    green: "bg-emerald-500",
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-xl border-2 border-transparent p-2 text-left transition hover:border-[#e7d0b9] hover:bg-[#fff9f2]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#526b7f]">{label}</span>
        <span className="text-xs font-black text-[#17324d]">{score}%</span>
      </div>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#edf1f4]">
        <div
          className={`h-full rounded-full ${bars[tone] || bars.navy}`}
          style={{ width: String(score) + "%" }}
        />
      </div>

      <div className="mt-1.5 flex justify-end">
        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
          Open →
        </span>
      </div>
    </button>
  );
}

function PremiumActionQueueItem({
  item,
  index = 0,
  onOpen = () => {},
}) {
  const tones = {
    urgent: {
      shell: "border-rose-300 bg-rose-50",
      number: "border-rose-300 bg-rose-500 text-white",
    },
    important: {
      shell: "border-orange-300 bg-orange-50",
      number: "border-orange-300 bg-orange-500 text-white",
    },
    normal: {
      shell: "border-sky-300 bg-sky-50",
      number: "border-sky-300 bg-sky-600 text-white",
    },
    success: {
      shell: "border-emerald-300 bg-emerald-50",
      number: "border-emerald-300 bg-emerald-600 text-white",
    },
  };

  const tone = tones[item.priority] || tones.normal;

  return (
    <article
      className={`rounded-[1.4rem] border-2 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone.shell}`}
    >
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black ${tone.number}`}
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ActionPriorityBadge priority={item.priority} />
                <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#607487]">
                  {item.source || "Student OS"}
                </span>
              </div>

              <h4 className="mt-3 break-words text-base font-black text-[#17324d]">
                {item.title}
              </h4>

              <p className="mt-2 text-[12px] leading-5 text-[#607487]">
                {item.message}
              </p>
            </div>

            <p className="shrink-0 text-[10px] font-semibold text-[#8a99a6]">
              {formatDate(item.date)}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#173f69] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange-500"
          >
            <span>{item.action || "Open Workspace"}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function ActionShortcutCard({
  eyebrow,
  title,
  text,
  tone = "navy",
  onClick = () => {},
}) {
  const tones = {
    navy: "border-[#9eb6c9] bg-[#edf4f8]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    green: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[190px] flex-col rounded-[1.4rem] border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md ${
        tones[tone] || tones.navy
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#607487]">
        {eyebrow}
      </p>
      <h4 className="mt-2 text-xl font-black text-[#17324d]">
        {title}
      </h4>
      <p className="mt-2 text-[12px] leading-5 text-[#607487]">
        {text}
      </p>

      <span className="mt-auto pt-4 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
        Open workspace →
      </span>
    </button>
  );
}

function ActionStat({ label, value, urgent = false, warning = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        urgent
          ? "border-red-200 bg-red-50"
          : warning
            ? "border-orange-300 bg-orange-50"
            : "border-slate-200 bg-[#fffaf4]"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-950/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value || 0}</p>
    </div>
  );
}

function ActionItem({ item, onOpen = () => {} }) {
  const styles = {
    urgent: "border-red-200 bg-red-50",
    important: "border-orange-300 bg-orange-50",
    normal: "border-blue-200 bg-blue-50",
    success: "border-emerald-200 bg-emerald-50",
  };

  const badgeStyles = {
    urgent: "border-red-200 bg-red-50 text-red-700",
    important: "border-orange-300 bg-orange-50 text-orange-700",
    normal: "border-blue-200 bg-blue-50 text-blue-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[item.priority] || "border-slate-200 bg-[#fffaf4]"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${badgeStyles[item.priority] || "border-slate-200 bg-white text-slate-950/45"}`}>
              {formatStatus(item.priority)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950/45">
              {item.source}
            </span>
          </div>
          <p className="mt-3 font-black text-slate-950">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-950/50">{item.message}</p>
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <p className="text-xs text-slate-950/35">{formatDate(item.date)}</p>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-600 transition hover:bg-orange-100"
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
    <div className="rounded-2xl border border-orange-200 bg-orange-500/[0.06] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
        {title}
      </p>
      <div className="mt-4 flex items-end gap-2">
        <p className="text-4xl font-black text-slate-950">{clampPercent(value)}</p>
        <p className="pb-1 text-sm font-black text-slate-950/35">%</p>
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
          ? "border-emerald-200 bg-emerald-50"
          : step.active
            ? "border-[#D4AF37]/30 bg-orange-50"
            : "border-slate-200 bg-[#fffaf4] hover:border-orange-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${
            step.complete
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : step.active
                ? "border-orange-200 bg-orange-50 text-orange-600"
                : "border-slate-200 bg-white text-slate-950/35"
          }`}
        >
          {step.complete ? "✓" : step.index + 1}
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-950/35">
          {step.active ? "Current" : step.complete ? "Done" : "Pending"}
        </span>
      </div>
      <p className="mt-4 text-sm font-black text-slate-950">{step.title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-950/45">{step.description}</p>
    </button>
  );
}

function DeadlineItem({ item, onOpen = () => {} }) {
  const styles = {
    urgent: "border-red-200 bg-red-50",
    important: "border-orange-300 bg-orange-50",
    normal: "border-blue-200 bg-blue-50",
    success: "border-emerald-200 bg-emerald-50",
  };

  const badgeStyles = {
    urgent: "border-red-200 bg-red-50 text-red-700",
    important: "border-orange-300 bg-orange-50 text-orange-700",
    normal: "border-blue-200 bg-blue-50 text-blue-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[item.priority] || "border-slate-200 bg-[#fffaf4]"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${badgeStyles[item.priority] || "border-slate-200 bg-white text-slate-950/45"}`}>
              {formatStatus(item.priority)}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950/45">
              {item.source}
            </span>
            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-600">
              {item.label}
            </span>
          </div>

          <p className="mt-3 font-black text-slate-950">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-950/50">{item.message}</p>
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <p className="text-xs text-slate-950/35">{formatDate(item.date)}</p>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-600 transition hover:bg-orange-100"
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
    <div className="rounded-2xl border border-slate-200 bg-[#fffaf4] p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-950/35">
        {label}
      </p>
      <p className="mt-3 break-words text-xl font-black text-slate-950">{value || "Not added"}</p>
    </div>
  );
}

function AnalyticsCard({ title, value, note, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-orange-200 bg-orange-50"
          : "border-slate-200 bg-[#fffaf4]"
      }`}
    >
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${highlight ? "text-orange-600" : "text-slate-950/35"}`}>
        {title}
      </p>
      <div className="mt-4 flex items-end gap-2">
        <p className="text-4xl font-black text-slate-950">{value}</p>
        <p className="pb-1 text-sm font-black text-slate-950/35">%</p>
      </div>
      <div className="mt-4">
        <ProgressBar value={value} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-950/45">{note}</p>
    </div>
  );
}

function ProgressBar({ value = 0 }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-orange-500 transition-all duration-500"
        style={{ width: String(clampPercent(value)) + "%" }}
      />
    </div>
  );
}

function ProgressRow({ label, value = 0 }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-950/45">{label}</p>
        <p className="text-xs font-black text-orange-600">{clampPercent(value)}%</p>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function RecommendationCard({ item, onOpen = () => {} }) {
  const styles = {
    urgent: "border-red-200 bg-red-50",
    warning: "border-orange-300 bg-orange-50",
    success: "border-emerald-200 bg-emerald-50",
    info: "border-blue-200 bg-blue-50",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[item.type] || "border-slate-200 bg-[#fffaf4]"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black text-slate-950">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-950/50">{item.message}</p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="w-fit shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-600 transition hover:bg-orange-100"
        >
          {item.action}
        </button>
      </div>
    </div>
  );
}



function SuccessTipCard({ item, onOpen = () => {} }) {
  const styles = {
    urgent: "border-red-200 bg-red-50",
    warning: "border-orange-300 bg-orange-50",
    success: "border-emerald-200 bg-emerald-50",
    info: "border-blue-200 bg-blue-50",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[item.type] || "border-slate-200 bg-[#fffaf4]"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black text-slate-950">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-950/50">{item.message}</p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="w-fit shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-600 transition hover:bg-orange-100"
        >
          {item.action}
        </button>
      </div>
    </div>
  );
}

function SuccessGuideCard({ guide, onOpen = () => {} }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-600">
        {guide.category}
      </span>

      <h3 className="mt-4 font-black text-slate-950">{guide.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-950/50">{guide.message}</p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-4 rounded-full border border-slate-200 bg-[#fffaf4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950/45 transition hover:border-orange-200 hover:text-orange-600"
      >
        {guide.action}
      </button>
    </div>
  );
}

function FAQCard({ faq }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="font-black text-slate-950">{faq.question}</p>
      <p className="mt-2 text-sm leading-6 text-slate-950/50">{faq.answer}</p>
    </div>
  );
}

function NotificationStat({ label, value, urgent = false, warning = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        urgent
          ? "border-red-200 bg-red-50"
          : warning
            ? "border-orange-300 bg-orange-50"
            : "border-slate-200 bg-[#fffaf4]"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-950/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value || 0}</p>
    </div>
  );
}

function NotificationItem({ item, onOpen = () => {} }) {
  const styles = {
    urgent: "border-red-200 bg-red-50",
    warning: "border-orange-300 bg-orange-50",
    success: "border-emerald-200 bg-emerald-50",
    info: "border-blue-200 bg-blue-50",
    neutral: "border-slate-200 bg-[#fffaf4]",
  };

  const badgeStyles = {
    urgent: "border-red-200 bg-red-50 text-red-700",
    warning: "border-orange-300 bg-orange-50 text-orange-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    neutral: "border-slate-200 bg-white text-slate-950/45",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[item.type] || styles.neutral}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${badgeStyles[item.type] || badgeStyles.neutral}`}>
              {formatStatus(item.type)}
            </span>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-950/45">
              {item.source}
            </span>
          </div>

          <h3 className="mt-3 font-black text-slate-950">{item.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-950/55">
            {item.message}
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <p className="text-xs text-slate-950/35">{formatDate(item.date)}</p>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-600 transition hover:bg-orange-100"
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
    <div className="rounded-2xl border border-slate-200 bg-[#fffaf4] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black text-slate-950">{event.title}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-950/55">
            {event.message || "No extra details."}
          </p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(event.status || event.type)}`}>
          {formatStatus(event.type || event.status)}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-950/35">{formatDate(event.date)}</p>
    </div>
  );
}

function SupportRequestHistoryCard({ request }) {
  const meta = getSupportRequestTypeMeta(request.request_type);

  return (
    <div className="rounded-2xl border border-slate-200 bg-[#fffaf4] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-black text-slate-950">
            {meta.icon} {request.subject || meta.subject}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-950/55">
            {request.message || meta.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(request.status || "open")}`}>
            {formatStatus(request.status || "open")}
          </span>
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
            {formatStatus(request.priority || meta.priority || "normal")}
          </span>
        </div>
      </div>

      {request.counselor_response ? (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
            Counselor Response
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-950/80">
            {request.counselor_response}
          </p>
          <p className="mt-3 text-xs text-slate-950/40">
            Responded: {formatDate(request.responded_at || request.updated_at)}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-50 p-4 text-sm text-blue-700">
          Waiting for counselor response. Zaifan team can see this request in Admin Support Requests.
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-950/40">
        <span>Submitted: {formatDate(request.created_at)}</span>
        {request.resolved_at ? <span>Resolved: {formatDate(request.resolved_at)}</span> : null}
      </div>
    </div>
  );
}



function ConnectionCard({ title, value, detail, tone = "neutral" }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warning"
        ? "border-orange-200 bg-orange-50 text-orange-800"
        : "border-slate-200 bg-white text-slate-700";

  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-sm ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
        {title}
      </p>
      <p className="mt-2 text-base font-black">{value}</p>
      <p className="mt-2 text-xs leading-5 opacity-75">{detail}</p>
    </div>
  );
}

function BridgeFlowItem({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
    </div>
  );
}


function StudentPortalSectionLoader({ label = "Opening Student OS section..." }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-4 text-sm font-black text-slate-900">{label}</p>
        <p className="mt-1 text-xs text-slate-400">
          Preparing only the student workspace you opened.
        </p>
      </div>
    </div>
  );
}

export default StudentPortalDashboard;