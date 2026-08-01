// CounselorQueuePanel PARTNER OS EXTREME — Executive Counselor Action Command
// src/components/admin/CounselorQueuePanel.jsx
//
// Maximum pass:
// - preserves current student prop API
// - deterministic local rules only; no fake GPT claim
// - safer document/task/application/university/communication normalization
// - stronger overdue task handling
// - recognizes more document name aliases and verification states
// - avoids false passport/IELTS warnings when equivalent documents exist
// - adds ownership, contactability, application, visa and communication checks
// - explains why each queue item exists and what counselor should do next
// - priority ordering and severity weighting
// - queue health summary + readiness score
// - stable-state handling when nothing needs attention
// - reduced-motion support
// - explicit white text on navy surfaces
// - stronger Zaifan Admin OS hierarchy and mobile behavior
// - read-only derived panel; no Supabase writes invented

import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileWarning,
  GraduationCap,
  Mail,
  MessageCircle,
  FileKey2,
  Plane,
  ShieldAlert,
  Sparkles,
  Target,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo } from "react";

const DAY_MS = 86400000;

const LEVEL_WEIGHT = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  stable: 0,
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function pretty(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function ageDays(value) {
  const date = safeDate(value);

  if (!date) return null;

  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / DAY_MS)
  );
}

function isTaskComplete(task = {}) {
  return ["completed", "done", "closed", "cancelled", "canceled"].includes(
    normalize(task.status)
  );
}

function isDocumentUsable(document = {}) {
  const status = normalize(document.status);

  return [
    "received",
    "verified",
    "approved",
    "uploaded",
    "accepted",
    "complete",
    "completed",
  ].includes(status);
}

function findDocument(documents, aliases = []) {
  const normalizedAliases = aliases.map(normalize);

  return documents.find((document) => {
    const name = normalize(
      document.document_name ||
        document.name ||
        document.type ||
        document.category
    );

    return normalizedAliases.some(
      (alias) => name === alias || name.includes(alias)
    );
  });
}

function hasOwner(student = {}) {
  return Boolean(
    student.assigned_admin_id ||
      student.assigned_to ||
      student.counselor_id ||
      student.owner_id ||
      student.assigned_counselor_id
  );
}

function hasPhone(student = {}) {
  return Boolean(
    student.phone ||
      student.phone_number ||
      student.whatsapp ||
      student.whatsapp_number
  );
}

function hasEmail(student = {}) {
  return Boolean(student.email);
}

function buildQueueItem({
  id,
  title,
  description,
  level,
  category,
  action,
  reason,
  icon,
}) {
  return {
    id,
    title,
    description,
    level,
    category,
    action,
    reason,
    icon,
    weight: LEVEL_WEIGHT[level] ?? 0,
  };
}

function CounselorQueuePanel({ student = {} }) {
  const reduceMotion = useReducedMotion();

  const model = useMemo(() => {
    const fullName =
      student?.full_name ||
      student?.name ||
      "Student";

    const documents = safeArray(student?.documents);
    const tasks = safeArray(student?.tasks);
    const universities = safeArray(student?.universities);
    const communications = safeArray(student?.communications);

    const application =
      student?.application ||
      safeArray(student?.applications)[0] ||
      null;

    const passport = findDocument(documents, [
      "passport",
      "passport copy",
      "travel document",
    ]);

    const englishEvidence = findDocument(documents, [
      "ielts",
      "english test",
      "language test",
      "pte",
      "toefl",
      "duolingo english test",
      "english proficiency",
    ]);

    const academicEvidence = findDocument(documents, [
      "transcript",
      "degree",
      "academic certificate",
      "marksheet",
      "mark sheet",
    ]);

    const financialEvidence = findDocument(documents, [
      "bank statement",
      "financial statement",
      "proof of funds",
      "funds",
    ]);

    const overdueTasks = tasks.filter((task) => {
      if (isTaskComplete(task)) return false;

      const due = safeDate(task.due_date);

      return due && due.getTime() < Date.now();
    });

    const dueSoonTasks = tasks.filter((task) => {
      if (isTaskComplete(task)) return false;

      const due = safeDate(task.due_date);

      if (!due) return false;

      const difference = Math.ceil(
        (due.getTime() - Date.now()) / DAY_MS
      );

      return difference >= 0 && difference <= 2;
    });

    const latestCommunication = communications
      .map((item) => ({
        ...item,
        __date:
          safeDate(item.created_at) ||
          safeDate(item.sent_at) ||
          safeDate(item.updated_at),
      }))
      .filter((item) => item.__date)
      .sort(
        (a, b) => b.__date.getTime() - a.__date.getTime()
      )[0];

    const communicationAge = latestCommunication?.__date
      ? ageDays(latestCommunication.__date)
      : null;

    const priority = normalize(student?.priority);

    const offerStatus = normalize(
      application?.offer_status ||
        application?.status ||
        student?.offer_status
    );

    const visaStatus = normalize(
      application?.visa_status ||
        student?.visa_status
    );

    const applicationStatus = normalize(
      application?.application_status ||
        application?.status
    );

    const ownerReady = hasOwner(student);
    const phoneReady = hasPhone(student);
    const emailReady = hasEmail(student);

    const queue = [];

    if (["vip", "high", "urgent", "critical"].includes(priority)) {
      queue.push(
        buildQueueItem({
          id: "priority-review",
          title: `Priority Review: ${fullName}`,
          description:
            "This student is marked high-priority and should remain visible in the counselor's active queue.",
          level: priority === "vip" || priority === "critical"
            ? "critical"
            : "high",
          category: "Priority",
          action: "Review the student record and confirm the next counselor action.",
          reason: `Priority is set to ${pretty(priority)}.`,
          icon: ShieldAlert,
        })
      );
    }

    if (!ownerReady) {
      queue.push(
        buildQueueItem({
          id: "assign-owner",
          title: "Assign Counselor Owner",
          description:
            "No responsible counselor is currently attached to this student record.",
          level: "critical",
          category: "Ownership",
          action: "Assign one accountable counselor before other workflow steps continue.",
          reason: "Ownership fields are empty.",
          icon: UserCheck,
        })
      );
    }

    if (!phoneReady && !emailReady) {
      queue.push(
        buildQueueItem({
          id: "recover-contact",
          title: "Recover Student Contact Details",
          description:
            "The student has no usable phone/WhatsApp or email contact method.",
          level: "critical",
          category: "Contact",
          action: "Recover at least one reliable contact channel.",
          reason: "Phone and email are both missing.",
          icon: Mail,
        })
      );
    } else if (!phoneReady || !emailReady) {
      queue.push(
        buildQueueItem({
          id: "complete-contact",
          title: "Complete Contact Profile",
          description:
            "One primary contact channel is missing from the student record.",
          level: "medium",
          category: "Contact",
          action: `Add the missing ${!phoneReady ? "phone/WhatsApp" : "email"} detail.`,
          reason: !phoneReady
            ? "Phone/WhatsApp is missing."
            : "Email is missing.",
          icon: MessageCircle,
        })
      );
    }

    if (!passport || !isDocumentUsable(passport)) {
      queue.push(
        buildQueueItem({
          id: "passport",
          title: "Collect Passport",
          description:
            "A usable passport document is not available in the student file.",
          level: "high",
          category: "Documents",
          action: "Request, upload, and verify the passport copy.",
          reason: passport
            ? `Passport status is ${pretty(passport.status || "missing")}.`
            : "No passport document record was found.",
          icon: FileKey2,
        })
      );
    }

    if (!englishEvidence || !isDocumentUsable(englishEvidence)) {
      queue.push(
        buildQueueItem({
          id: "english-evidence",
          title: "Collect English-Language Evidence",
          description:
            "Language evidence is missing or not yet usable for application planning.",
          level: "high",
          category: "Documents",
          action:
            "Confirm whether IELTS/PTE/TOEFL/DET or another accepted English route is required.",
          reason: englishEvidence
            ? `Current language-document status is ${pretty(
                englishEvidence.status || "missing"
              )}.`
            : "No recognized English-language evidence was found.",
          icon: FileWarning,
        })
      );
    }

    if (!academicEvidence || !isDocumentUsable(academicEvidence)) {
      queue.push(
        buildQueueItem({
          id: "academic-evidence",
          title: "Complete Academic Documents",
          description:
            "Academic evidence appears incomplete for reliable university/application work.",
          level: "medium",
          category: "Documents",
          action:
            "Check transcripts, certificates, degrees, and missing academic records.",
          reason: academicEvidence
            ? `Academic-document status is ${pretty(
                academicEvidence.status || "missing"
              )}.`
            : "No recognized transcript/degree document was found.",
          icon: FileCheck2,
        })
      );
    }

    if (universities.length === 0) {
      queue.push(
        buildQueueItem({
          id: "university-shortlist",
          title: "Build University Shortlist",
          description:
            "No university options have been saved for this student.",
          level: "medium",
          category: "Planning",
          action:
            "Create a realistic shortlist based on academic fit, budget, intake, and destination.",
          reason: "University list is empty.",
          icon: GraduationCap,
        })
      );
    }

    if (!application) {
      queue.push(
        buildQueueItem({
          id: "create-application",
          title: "Create Application Record",
          description:
            "The student has no application record connected to the Student OS.",
          level: "medium",
          category: "Application",
          action:
            "Create the application profile once the university/program direction is clear.",
          reason: "No application object or application record was found.",
          icon: BookOpenCheck,
        })
      );
    } else {
      if (
        !applicationStatus ||
        ["not started", "not_started", "new"].includes(applicationStatus)
      ) {
        queue.push(
          buildQueueItem({
            id: "start-application",
            title: "Start Application Workflow",
            description:
              "An application record exists but the workflow has not materially started.",
            level: "medium",
            category: "Application",
            action:
              "Confirm university, program, intake, required documents, and submission target.",
            reason: `Application status is ${pretty(
              applicationStatus || "not started"
            )}.`,
            icon: Target,
          })
        );
      }

      if (
        ["offer received", "offer_received", "received", "accepted"].includes(
          offerStatus
        ) &&
        (
          !visaStatus ||
          ["not started", "not_started", "new", "pending"].includes(visaStatus)
        )
      ) {
        queue.push(
          buildQueueItem({
            id: "start-visa",
            title: "Start Visa Workflow",
            description:
              "An offer is available but visa preparation has not started.",
            level: "high",
            category: "Visa",
            action:
              "Open the visa checklist and begin financial, document, and appointment preparation.",
            reason: `Offer status is ${pretty(
              offerStatus
            )}, while visa status is ${pretty(
              visaStatus || "not started"
            )}.`,
            icon: Plane,
          })
        );
      }

      if (
        ["visa process", "visa_process", "in progress", "in_progress"].includes(
          visaStatus
        ) &&
        (!financialEvidence || !isDocumentUsable(financialEvidence))
      ) {
        queue.push(
          buildQueueItem({
            id: "visa-financials",
            title: "Complete Visa Financial Evidence",
            description:
              "Visa processing is active but financial evidence appears incomplete.",
            level: "high",
            category: "Visa",
            action:
              "Review proof-of-funds/bank-statement requirements and verify the uploaded evidence.",
            reason: financialEvidence
              ? `Financial-document status is ${pretty(
                  financialEvidence.status || "missing"
                )}.`
              : "No recognized financial evidence was found.",
            icon: FileWarning,
          })
        );
      }
    }

    if (overdueTasks.length > 0) {
      queue.push(
        buildQueueItem({
          id: "overdue-tasks",
          title: "Resolve Overdue Tasks",
          description: `${overdueTasks.length} active task${
            overdueTasks.length === 1 ? "" : "s"
          } are past due.`,
          level: "critical",
          category: "Tasks",
          action:
            "Open the task center, complete or reschedule each overdue action, and keep an owner on every task.",
          reason: `${overdueTasks.length} task${
            overdueTasks.length === 1 ? " is" : "s are"
          } overdue.`,
          icon: Clock3,
        })
      );
    } else if (dueSoonTasks.length > 0) {
      queue.push(
        buildQueueItem({
          id: "due-soon-tasks",
          title: "Tasks Due Soon",
          description: `${dueSoonTasks.length} active task${
            dueSoonTasks.length === 1 ? "" : "s"
          } are due within 48 hours.`,
          level: "medium",
          category: "Tasks",
          action: "Review upcoming tasks before they become overdue.",
          reason: `${dueSoonTasks.length} task${
            dueSoonTasks.length === 1 ? " is" : "s are"
          } due soon.`,
          icon: Clock3,
        })
      );
    }

    if (communications.length === 0) {
      queue.push(
        buildQueueItem({
          id: "first-follow-up",
          title: "First Student Follow-Up",
          description:
            "No communication history exists for this student.",
          level: "medium",
          category: "Communication",
          action:
            "Make the first counselor contact and log the communication.",
          reason: "Communication history is empty.",
          icon: MessageCircle,
        })
      );
    } else if (
      communicationAge !== null &&
      communicationAge >= 7
    ) {
      queue.push(
        buildQueueItem({
          id: "communication-stale",
          title: "Student Follow-Up Is Stale",
          description: `The latest recorded communication is ${communicationAge} day${
            communicationAge === 1 ? "" : "s"
          } old.`,
          level: communicationAge >= 14 ? "high" : "medium",
          category: "Communication",
          action:
            "Review the case and contact the student if a next step is still pending.",
          reason: `No communication has been logged for ${communicationAge} days.`,
          icon: MessageCircle,
        })
      );
    }

    const gptRisk = String(
      student?.gpt_risk ||
        student?.ai_risk ||
        ""
    ).trim();

    if (gptRisk) {
      queue.push(
        buildQueueItem({
          id: "ai-risk",
          title: "Review AI Risk Assessment",
          description: gptRisk,
          level: "high",
          category: "AI Risk",
          action:
            "Treat this as a review signal, verify the underlying CRM evidence, and decide the counselor action manually.",
          reason: "A stored AI/GPT risk note exists on the student record.",
          icon: Bot,
        })
      );
    }

    const sortedQueue = queue.sort((a, b) => {
      if (b.weight !== a.weight) {
        return b.weight - a.weight;
      }

      return a.category.localeCompare(b.category);
    });

    const stableQueue =
      sortedQueue.length > 0
        ? sortedQueue
        : [
            buildQueueItem({
              id: "stable",
              title: "Student Operating Normally",
              description:
                "No urgent counselor action was detected from the currently loaded student data.",
              level: "stable",
              category: "Stable",
              action:
                "Continue normal follow-up and keep student records current.",
              reason:
                "No queue rule currently requires intervention.",
              icon: CheckCircle2,
            }),
          ];

    const counts = {
      critical: stableQueue.filter(
        (item) => item.level === "critical"
      ).length,
      high: stableQueue.filter(
        (item) => item.level === "high"
      ).length,
      medium: stableQueue.filter(
        (item) => item.level === "medium"
      ).length,
      stable: stableQueue.filter(
        (item) => item.level === "stable"
      ).length,
    };

    const weightedPressure =
      counts.critical * 4 +
      counts.high * 3 +
      counts.medium * 2;

    const maxPressure = Math.max(
      1,
      stableQueue.length * 4
    );

    const readiness = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            (weightedPressure / maxPressure) * 100
        )
      )
    );

    return {
      queue: stableQueue,
      counts,
      readiness,
      fullName,
      ownerReady,
      phoneReady,
      emailReady,
      overdueTasks: overdueTasks.length,
      communications: communications.length,
    };
  }, [student]);

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 12 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.28,
      }}
      className="min-w-0 space-y-4 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_22px_60px_rgba(18,56,101,0.14)] sm:p-4"
    >
      <div className="grid min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#FF5A0A] bg-white lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <Target size={12} />
              Counselor Operations
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <Sparkles size={12} />
              Local Action Queue
            </span>
          </div>

          <h2 className="mt-4 max-w-4xl break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
            Counselor Queue
          </h2>

          <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
            Surface missing documents, ownership gaps, overdue work,
            application blockers, communication needs, visa triggers and
            stored risk signals for {model.fullName}.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DarkMetric
              label="Critical"
              value={model.counts.critical}
            />
            <DarkMetric
              label="High"
              value={model.counts.high}
            />
            <DarkMetric
              label="Medium"
              value={model.counts.medium}
            />
            <DarkMetric
              label="Queue Items"
              value={model.queue.length}
            />
          </div>
        </div>

        <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
            Student Readiness
          </p>

          <p className="mt-3 text-5xl font-black text-white">
            {model.readiness}%
          </p>

          <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-white">
            operational readiness
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <OrangeMetric
              label="Owner"
              value={model.ownerReady ? "Ready" : "Missing"}
            />

            <OrangeMetric
              label="Contact"
              value={
                model.phoneReady || model.emailReady
                  ? "Ready"
                  : "Missing"
              }
            />
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-5 rounded-[1.65rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_12px_34px_rgba(18,56,101,0.06)] sm:p-5">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <QueueMetric
            label="Critical"
            value={model.counts.critical}
            tone="critical"
            icon={ShieldAlert}
          />

          <QueueMetric
            label="High"
            value={model.counts.high}
            tone="high"
            icon={AlertTriangle}
          />

          <QueueMetric
            label="Medium"
            value={model.counts.medium}
            tone="medium"
            icon={CircleAlert}
          />

          <QueueMetric
            label="Stable"
            value={model.counts.stable}
            tone="stable"
            icon={CheckCircle2}
          />
        </div>

        {model.queue[0] ? (
          <div className="rounded-[1.45rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-orange-700">
                  Counselor First Move
                </p>

                <p className="mt-1 break-words text-base font-black leading-5 text-[#10233F]">
                  {model.queue[0].title}
                </p>

                <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
                  {model.queue[0].action}
                </p>
              </div>

              <span className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${getQueueStyle(model.queue[0].level).badge}`}>
                {model.queue[0].level}
              </span>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {model.queue.map((item, index) => (
            <QueueRow
              key={item.id}
              item={item}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>

        <MethodologyNote />
      </div>
    </motion.section>
  );
}

function QueueRow({
  item,
  index,
  reduceMotion,
}) {
  const Icon = item.icon || AlertTriangle;
  const style = getQueueStyle(item.level);

  return (
    <motion.article
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 8 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.12),
      }}
      className={`min-w-0 overflow-hidden rounded-[1.45rem] border-[3px] bg-white shadow-[0_8px_22px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(18,56,101,0.09)] ${style.border}`}
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,14rem)]">
        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${style.icon}`}
            >
              <Icon size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words font-black leading-5 text-[#10233F]">
                  {item.title}
                </h3>

                <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFFDF8] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
                  {item.category}
                </span>

                <span
                  className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${style.badge}`}
                >
                  {item.level}
                </span>
              </div>

              <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-700">
                {item.description}
              </p>

              <div className="mt-3 grid min-w-0 gap-2">
                <InfoBox
                  label="Why this is here"
                  text={item.reason}
                  tone="slate"
                />

                <InfoBox
                  label="Recommended next move"
                  text={item.action}
                  tone="orange"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`flex min-w-0 items-center justify-center border-t-[3px] p-4 lg:border-l-[3px] lg:border-t-0 ${style.side}`}
        >
          <div className="min-w-0 text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              Action Priority
            </p>

            <p className="mt-1 text-2xl font-black text-[#10233F]">
              {LEVEL_WEIGHT[item.level] ?? 0}/4
            </p>

            <p className="mt-2 text-[10px] font-bold text-slate-600">
              {item.level === "stable"
                ? "No intervention"
                : "Counselor review required"}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function QueueMetric({
  label,
  value,
  tone,
  icon: Icon,
}) {
  const style = getQueueStyle(tone);

  return (
    <div
      className={`min-w-0 rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${style.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.1em] text-slate-600">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-[#10233F]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${style.icon}`}
        >
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  text,
  tone = "slate",
}) {
  const style =
    tone === "orange"
      ? "border-[#FF5A0A] bg-[#FFF4E8]"
      : "border-[#C9D7E6] bg-[#FFFDF8]";

  return (
    <div
      className={`min-w-0 rounded-xl border-[2px] p-3 shadow-[0_4px_12px_rgba(18,56,101,0.03)] ${style}`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-700">
        {text}
      </p>
    </div>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeMetric({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function MethodologyNote() {
  return (
    <div className="rounded-[1.45rem] border-[3px] border-[#123865] bg-[#F2F7FF] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865] bg-[#123865] text-white">
          <BadgeCheck size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black text-[#10233F]">
            Queue methodology
          </p>

          <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-700">
            This panel reads the student data already supplied to it and
            generates counselor actions locally. It does not write to Supabase
            or automatically execute tasks. Any stored GPT/AI risk note is
            treated as a review signal, not as a final decision.
          </p>
        </div>
      </div>
    </div>
  );
}

function getQueueStyle(level = "") {
  if (level === "critical") {
    return {
      border: "border-[#FB7185]",
      card: "border-[#FB7185] bg-[#FFF4F4]",
      icon: "border-[#FB7185] text-red-700",
      badge: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
      side: "border-[#FB7185] bg-[#FFF4F4]",
    };
  }

  if (level === "high") {
    return {
      border: "border-[#F59E0B]",
      card: "border-[#F59E0B] bg-[#FFF7ED]",
      icon: "border-[#F59E0B] text-amber-800",
      badge: "border-[#F59E0B] bg-[#FFF7ED] text-amber-900",
      side: "border-[#F59E0B] bg-[#FFF7ED]",
    };
  }

  if (level === "medium") {
    return {
      border: "border-[#60A5FA]",
      card: "border-[#60A5FA] bg-[#F2F7FF]",
      icon: "border-[#60A5FA] text-blue-700",
      badge: "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
      side: "border-[#60A5FA] bg-[#F2F7FF]",
    };
  }

  return {
    border: "border-[#34D399]",
    card: "border-[#34D399] bg-[#F0FFF8]",
    icon: "border-[#34D399] text-emerald-700",
    badge: "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    side: "border-[#34D399] bg-[#F0FFF8]",
  };
}

export default CounselorQueuePanel;
