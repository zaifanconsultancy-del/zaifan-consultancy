// SmartActionsPanel PARTNER OS EXTREME — Compact Counselor Action Command
// src/components/admin/SmartActionsPanel.jsx
//
// Maximum pass:
// - preserves live Student OS action generation
// - preserves WhatsApp + Gmail compose actions
// - removes misleading "AI" wording: these actions are deterministic/rules-based
// - fixes English-test detection so existing PTE/IELTS/English-test records are respected
// - safer document/task/university/application normalization
// - malformed due dates no longer create false overdue actions
// - supports common completed task statuses
// - safer Pakistan mobile normalization for 03XXXXXXXXX -> 923XXXXXXXXX
// - adds Copy Message action
// - adds inline action feedback instead of relying only on alert()
// - adds action priority counts and contact-readiness status
// - avoids pretending contact actions work when email/phone is missing
// - reduced-motion support
// - stronger Admin OS cream/orange/navy contrast
// - no backend writes, no GPT calls, no fake AI

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  FileText,
  GraduationCap,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function safeDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getStudentName(student = {}) {
  return (
    student?.full_name ||
    student?.name ||
    student?.student_name ||
    "Student"
  );
}

function normalizeWhatsAppPhone(value = "") {
  let digits = String(value || "").replace(/[^\d]/g, "");

  if (!digits) return "";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Common Pakistan local mobile format: 03XXXXXXXXX -> 923XXXXXXXXX.
  // This is only applied when the number clearly matches that pattern.
  if (/^03\d{9}$/.test(digits)) {
    return `92${digits.slice(1)}`;
  }

  return digits;
}

function documentMatches(document = {}, aliases = []) {
  const name = normalize(
    document.document_name ||
      document.name ||
      document.type ||
      document.category
  );

  return aliases.some((alias) => {
    const normalizedAlias = normalize(alias);

    return (
      name === normalizedAlias ||
      name.includes(normalizedAlias) ||
      normalizedAlias.includes(name)
    );
  });
}

function isDocumentUsable(document = {}) {
  const status = normalize(document.status);

  if (!status) return true;

  return ![
    "missing",
    "rejected",
    "expired",
    "removed",
    "deleted",
  ].includes(status);
}

function hasUsableDocument(documents = [], aliases = []) {
  return documents.some(
    (document) =>
      documentMatches(document, aliases) &&
      isDocumentUsable(document)
  );
}

function isTaskCompleted(task = {}) {
  return [
    "completed",
    "done",
    "closed",
    "cancelled",
    "canceled",
  ].includes(normalize(task.status));
}

function getOverdueTasks(tasks = []) {
  const now = new Date();

  return safeArray(tasks).filter((task) => {
    if (isTaskCompleted(task)) return false;

    const due = safeDate(
      task.due_date ||
        task.deadline ||
        task.due_at
    );

    if (!due) return false;

    if (
      task.due_time &&
      /^\d{1,2}:\d{2}/.test(String(task.due_time))
    ) {
      const [hours, minutes] = String(task.due_time)
        .split(":")
        .map(Number);

      due.setHours(
        Number.isFinite(hours) ? hours : 23,
        Number.isFinite(minutes) ? minutes : 59,
        59,
        999
      );
    } else {
      due.setHours(23, 59, 59, 999);
    }

    return due < now;
  });
}

function getApplication(student = {}) {
  if (student?.application && !Array.isArray(student.application)) {
    return student.application;
  }

  if (
    Array.isArray(student?.applications) &&
    student.applications.length
  ) {
    return student.applications[0];
  }

  return null;
}

function getPriorityWeight(priority = "") {
  const value = normalize(priority);

  if (value === "urgent") return 4;
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

function SmartActionsPanel({ student = {} }) {
  const reduceMotion = useReducedMotion();
  const [feedback, setFeedback] = useState("");
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);

  const fullName = getStudentName(student);
  const rawPhone =
    student?.phone ||
    student?.phone_number ||
    student?.whatsapp ||
    "";

  const phone = normalizeWhatsAppPhone(rawPhone);
  const email = String(student?.email || "").trim();

  const documents = safeArray(student?.documents);
  const tasks = safeArray(student?.tasks);
  const universities = safeArray(
    student?.universities ||
      student?.university_plan ||
      student?.shortlist
  );

  const application = getApplication(student);

  const actions = useMemo(() => {
    const generated = [];

    const overdueTasks = getOverdueTasks(tasks);

    const hasPassport = hasUsableDocument(
      documents,
      ["Passport"]
    );

    const hasEnglishTest = hasUsableDocument(
      documents,
      [
        "IELTS",
        "PTE",
        "English Test",
        "English Language Test",
        "TOEFL",
        "Duolingo English Test",
      ]
    );

    if (!hasPassport) {
      generated.push({
        id: "request-passport",
        label: "Request Passport",
        badge: "Document",
        priority: "high",
        icon: FileText,
        subject: "Passport Required — Zaifan Consultancy",
        message: `Hi ${fullName},

Please send a clear copy of your passport so we can continue your application process.

Best regards,
Zaifan Consultancy`,
      });
    }

    if (!hasEnglishTest) {
      generated.push({
        id: "request-english-test",
        label: "Check English Test",
        badge: "Document",
        priority: "high",
        icon: FileText,
        subject: "English Test Status — Zaifan Consultancy",
        message: `Hi ${fullName},

Please share your IELTS, PTE, TOEFL, Duolingo English Test, or other accepted English-language result if available. If you have not taken a test yet, we can review the next suitable step with you.

Best regards,
Zaifan Consultancy`,
      });
    }

    if (universities.length === 0) {
      generated.push({
        id: "build-shortlist",
        label: "Build University Shortlist",
        badge: "University",
        priority: "medium",
        icon: GraduationCap,
        subject: "University Shortlist — Zaifan Consultancy",
        message: `Hi ${fullName},

The next step is to prepare your university shortlist based on your target country, program, academic profile, budget, and intake.

Best regards,
Zaifan Consultancy`,
      });
    }

    if (!application) {
      generated.push({
        id: "create-application-profile",
        label: "Create Application Profile",
        badge: "Application",
        priority: "medium",
        icon: Target,
        subject: "Application Profile — Zaifan Consultancy",
        message: `Hi ${fullName},

We need to complete your application profile with your target country, university, program, intake, and supporting documents before we move forward.

Best regards,
Zaifan Consultancy`,
      });
    }

    const offerStatus = normalize(
      application?.offer_status ||
        student?.offer_status
    );

    const visaStatus = normalize(
      application?.visa_status ||
        student?.visa_status
    );

    if (
      [
        "offer_received",
        "offer_accepted",
        "accepted",
        "conditional_offer",
        "unconditional_offer",
      ].includes(offerStatus) &&
      [
        "",
        "not_started",
        "pending_start",
      ].includes(visaStatus)
    ) {
      generated.push({
        id: "start-visa-process",
        label: "Start Visa Preparation",
        badge: "Visa",
        priority: "high",
        icon: ShieldCheck,
        subject: "Visa Preparation — Zaifan Consultancy",
        message: `Hi ${fullName},

Your offer stage is progressing. The next step is to prepare for the visa process. Please keep your financial, academic, passport, and other required supporting documents ready for review.

Best regards,
Zaifan Consultancy`,
      });
    }

    if (overdueTasks.length > 0) {
      generated.push({
        id: "urgent-task-followup",
        label: "Urgent Task Follow-up",
        badge: "Operations",
        priority: "urgent",
        icon: AlertTriangle,
        subject: "Urgent Process Follow-up — Zaifan Consultancy",
        message: `Hi ${fullName},

We are reviewing the pending items in your process and need to clear the urgent next steps. Please check your recent requests from Zaifan Consultancy and share any outstanding information as soon as possible.

Best regards,
Zaifan Consultancy`,
      });
    }

    const studentPriority = normalize(student?.priority);

    if (
      studentPriority === "vip" ||
      studentPriority === "high"
    ) {
      generated.push({
        id: "priority-counselor-followup",
        label: "Priority Counselor Follow-up",
        badge: "Priority",
        priority: "high",
        icon: UserRoundCheck,
        subject: "Priority Follow-up — Zaifan Consultancy",
        message: `Hi ${fullName},

This is Zaifan Consultancy following up personally on your study-abroad process. We would like to move your case forward quickly and confirm your next required step.

Best regards,
Zaifan Consultancy`,
      });
    }

    generated.push({
      id: "general-followup",
      label: "General Follow-up",
      badge: "Communication",
      priority: "normal",
      icon: MessageCircle,
      subject: "Zaifan Consultancy Follow-up",
      message: `Hi ${fullName},

Just following up regarding your Zaifan Consultancy process. Please let us know if you have any updates, questions, or documents to share.

Best regards,
Zaifan Consultancy`,
    });

    return generated.sort(
      (a, b) =>
        getPriorityWeight(b.priority) -
        getPriorityWeight(a.priority)
    );
  }, [
    documents,
    tasks,
    universities,
    application,
    fullName,
    student?.offer_status,
    student?.visa_status,
    student?.priority,
  ]);

  const metrics = useMemo(() => {
    const urgent = actions.filter(
      (action) => action.priority === "urgent"
    ).length;

    const high = actions.filter(
      (action) => action.priority === "high"
    ).length;

    const documentsCount = actions.filter(
      (action) => action.badge === "Document"
    ).length;

    return {
      urgent,
      high,
      documentsCount,
    };
  }, [actions]);

  const openWhatsApp = (action) => {
    if (!phone) {
      setFeedback(
        "This student has no usable phone number for WhatsApp."
      );
      return;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      action.message
    )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

    setFeedback(
      `WhatsApp opened for ${action.label}.`
    );
  };

  const openEmail = (action) => {
    if (!email) {
      setFeedback(
        "This student has no email address."
      );
      return;
    }

    const gmailUrl =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(email)}` +
      `&su=${encodeURIComponent(action.subject)}` +
      `&body=${encodeURIComponent(action.message)}`;

    window.open(
      gmailUrl,
      "_blank",
      "noopener,noreferrer"
    );

    setFeedback(
      `Gmail compose opened for ${action.label}.`
    );
  };

  const copyMessage = async (action) => {
    try {
      await navigator.clipboard.writeText(
        action.message
      );

      setFeedback(
        `${action.label} message copied.`
      );
    } catch (error) {
      console.error(
        "Smart action copy failed:",
        error
      );

      setFeedback(
        "Message could not be copied."
      );
    }
  };

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.24,
      }}
      className="min-w-0 space-y-4 rounded-[2.15rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_20px_55px_rgba(18,56,101,0.12)] sm:p-3"
    >
      <div className="grid min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#FF5A0A] bg-white lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <div
          className="min-w-0 bg-[#123865] p-4 sm:p-5 lg:p-6"
          style={{ color: "#FFFFFF" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
            <Sparkles
              size={13}
              style={{ color: "#FDBA74" }}
            />

            <p
              className="text-[9px] font-black uppercase tracking-[0.1em]"
              style={{ color: "#FFFFFF" }}
            >
              Counselor Intelligence
            </p>
          </div>

          <h3
            className="mt-3 break-words text-xl font-black tracking-[-0.025em] sm:text-2xl"
            style={{ color: "#FFFFFF" }}
          >
            Smart Counselor Actions
          </h3>

          <p
            className="mt-2 max-w-2xl text-sm font-semibold leading-6"
            style={{ color: "#F8FAFC" }}
          >
            Rules-based next actions generated from the student’s live
            documents, tasks, university planning, application stage, and
            priority.
          </p>
        </div>

        <div
          className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-4 sm:p-5 lg:border-l-[3px] lg:border-t-0 lg:p-6"
          style={{ color: "#FFFFFF" }}
        >
          <div className="flex items-center gap-2">
            <Zap size={18} />

            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
              Action Queue
            </p>
          </div>

          <p className="mt-3 text-4xl font-black text-white">
            {actions.length}
          </p>

          <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            Recommended Actions
          </p>

          <p className="mt-4 text-xs font-semibold leading-5 text-white">
            {metrics.urgent} urgent · {metrics.high} high ·{" "}
            {metrics.documentsCount} document action
            {metrics.documentsCount === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <StatusCard
          label="Phone"
          value={phone ? "Ready" : "Missing"}
          helper={
            phone
              ? "WhatsApp action available."
              : "Add a phone number to enable WhatsApp."
          }
          tone={phone ? "good" : "warning"}
          icon={MessageCircle}
        />

        <StatusCard
          label="Email"
          value={email ? "Ready" : "Missing"}
          helper={
            email
              ? "Gmail compose available."
              : "Add an email address to enable email."
          }
          tone={email ? "good" : "warning"}
          icon={Mail}
        />

        <StatusCard
          label="Urgent"
          value={metrics.urgent}
          helper="Immediate operations pressure."
          tone={metrics.urgent ? "danger" : "good"}
          icon={AlertTriangle}
        />

        <StatusCard
          label="High Priority"
          value={metrics.high}
          helper="Important counselor actions."
          tone={metrics.high ? "orange" : "good"}
          icon={Target}
        />
      </div>

      <section className="rounded-[1.45rem] border-[3px] border-[#123865] bg-white p-3">
        <button
          type="button"
          onClick={() =>
            setWorkspaceExpanded((current) => !current)
          }
          aria-expanded={workspaceExpanded}
          className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 py-3 text-left transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
        >
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Counselor Action Workspace
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {workspaceExpanded
                ? "Hide prepared messages and communication actions."
                : "Open prepared messages and communication actions."}
            </p>
          </div>

          <Zap
            size={17}
            className={`shrink-0 text-[#123865] transition ${
              workspaceExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </section>

      {workspaceExpanded ? (
        <div className="min-w-0 space-y-4 rounded-[1.55rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_10px_26px_rgba(18,56,101,0.05)] sm:p-5">
        {feedback ? (
          <div
            role="status"
            className="flex min-w-0 items-start justify-between gap-3 rounded-xl border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)]"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />

              <p className="text-sm font-semibold leading-6 text-orange-900">
                {feedback}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFeedback("")}
              aria-label="Dismiss message"
              className="shrink-0 rounded-lg px-2 py-1 text-sm font-black text-orange-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
            >
              ×
            </button>
          </div>
        ) : null}

        <div className="grid min-w-0 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;

            return (
              <motion.article
                key={action.id}
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 8,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: reduceMotion
                    ? 0
                    : 0.2,
                  delay: reduceMotion
                    ? 0
                    : Math.min(
                        index * 0.025,
                        0.15
                      ),
                }}
                className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${getActionStyle(
                  action.priority
                )}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${getIconStyle(
                      action.priority
                    )}`}
                  >
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-[#10233f]">
                        {action.label}
                      </p>

                      <span className="rounded-full border-2 border-slate-300 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600">
                        {action.badge}
                      </span>
                    </div>

                    <PriorityBadge
                      priority={action.priority}
                    />

                    <p className="mt-3 max-h-36 overflow-auto whitespace-pre-line rounded-xl border-2 border-[#C9D7E6] bg-white p-3 text-sm font-semibold leading-6 text-slate-700">
                      {action.message}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsApp(action)
                    }
                    disabled={!phone}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => openEmail(action)}
                    disabled={!email}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] px-3 text-xs font-black text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <Mail size={14} />
                    Email
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyMessage(action)
                    }
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                  >
                    <Clipboard size={14} />
                    Copy
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="flex min-w-0 items-start gap-3 rounded-xl border-[3px] border-[#123865] bg-[#FFF8EF] p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />

          <p className="text-xs font-semibold leading-5 text-slate-600">
            These suggestions are generated by explicit CRM rules. They do not
            call GPT and they do not automatically change student records.
            Counselors should review the student context before sending any
            message.
          </p>
        </div>
        </div>
      ) : null}
    </motion.section>
  );
}

function StatusCard({
  label,
  value,
  helper,
  tone = "orange",
  icon: Icon,
}) {
  const dark = tone === "navy";

  const style =
    tone === "danger"
      ? "border-red-300 bg-red-50"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-[#FF5A0A] bg-[#FFF4E8]";

  return (
    <div
      className={`min-w-0 rounded-[1.3rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)] ${style}`}
      style={{
        color: dark ? "#FFFFFF" : "#10233F",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{
              color: dark
                ? "#FDBA74"
                : "#64748B",
            }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-xl font-black"
            style={{
              color: dark
                ? "#FFFFFF"
                : "#10233F",
            }}
          >
            {value}
          </p>
        </div>

        <Icon
          size={17}
          style={{
            color: dark
              ? "#FDBA74"
              : "#C2410C",
          }}
        />
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{
          color: dark
            ? "#F8FAFC"
            : "#64748B",
        }}
      >
        {helper}
      </p>
    </div>
  );
}

function PriorityBadge({ priority = "normal" }) {
  const style =
    priority === "urgent"
      ? "border-red-300 bg-red-50 text-red-700"
      : priority === "high"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : priority === "medium"
      ? "border-blue-300 bg-blue-50 text-blue-700"
      : "border-slate-300 bg-slate-50 text-slate-600";

  return (
    <span
      className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${style}`}
    >
      {priority}
    </span>
  );
}

function getActionStyle(priority = "") {
  if (priority === "urgent") {
    return "border-red-300 bg-red-50";
  }

  if (priority === "high") {
    return "border-orange-300 bg-orange-50";
  }

  if (priority === "medium") {
    return "border-blue-300 bg-blue-50";
  }

  return "border-slate-300 bg-white";
}

function getIconStyle(priority = "") {
  if (priority === "urgent") {
    return "border-red-300 text-red-700";
  }

  if (priority === "high") {
    return "border-orange-300 text-orange-700";
  }

  if (priority === "medium") {
    return "border-blue-300 text-blue-700";
  }

  return "border-slate-300 text-[#10233f]";
}

export default SmartActionsPanel;
