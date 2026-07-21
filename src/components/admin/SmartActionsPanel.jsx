// SmartActionsPanel V2 — Counselor Intelligence Actions
// Preserves live Student OS action generation, document/task/university/application checks,
// WhatsApp launching and Gmail compose actions.
// Visual layer aligned with the approved Zaifan Admin OS.

import { useMemo } from "react";

function SmartActionsPanel({ student = {} }) {
  const fullName = student?.full_name || student?.name || "Student";
  const phone = student?.phone || student?.phone_number || "";
  const email = student?.email || "";

  const documents = Array.isArray(student?.documents) ? student.documents : [];
  const tasks = Array.isArray(student?.tasks) ? student.tasks : [];
  const universities = Array.isArray(student?.universities)
    ? student.universities
    : [];

  const application = student?.application || null;

  const actions = useMemo(() => {
    const generated = [];

    const findDocument = (name) =>
      documents.find(
        (doc) =>
          String(doc.document_name || "").toLowerCase() ===
          String(name).toLowerCase()
      );

    const isDocumentMissing = (name) => {
      const doc = findDocument(name);
      return !doc || doc.status === "missing" || doc.status === "rejected";
    };

    const overdueTasks = tasks.filter((task) => {
      if (!task?.due_date || task.status === "completed") return false;
      return new Date(task.due_date) < new Date();
    });

    if (isDocumentMissing("Passport")) {
      generated.push({
        label: "Request Passport",
        badge: "Document",
        priority: "high",
        message: `Hi ${fullName}, please send your passport copy so we can continue your application process.`,
      });
    }

    if (isDocumentMissing("IELTS")) {
      generated.push({
        label: "Request IELTS / PTE",
        badge: "Document",
        priority: "high",
        message: `Hi ${fullName}, please share your IELTS/PTE result if available. If you have not taken the test yet, we can guide you on the next step.`,
      });
    }

    if (universities.length === 0) {
      generated.push({
        label: "Build University Shortlist",
        badge: "University",
        priority: "medium",
        message: `Hi ${fullName}, let's prepare your university shortlist based on your target country, program, budget, and intake.`,
      });
    }

    if (!application) {
      generated.push({
        label: "Create Application Profile",
        badge: "Application",
        priority: "medium",
        message: `Hi ${fullName}, we need to complete your application profile with your target country, university, program, intake, and documents.`,
      });
    }

    if (
      application?.offer_status === "offer_received" &&
      application?.visa_status === "not_started"
    ) {
      generated.push({
        label: "Start Visa Process",
        badge: "Visa",
        priority: "high",
        message: `Hi ${fullName}, your offer has been received. The next step is to start your visa preparation. Please prepare your financial and academic documents.`,
      });
    }

    if (overdueTasks.length > 0) {
      generated.push({
        label: "Urgent Task Follow-up",
        badge: "Operations",
        priority: "urgent",
        message: `Hi ${fullName}, we are reviewing your pending process items and will update you shortly on the urgent next steps.`,
      });
    }

    if (student?.priority === "vip" || student?.priority === "high") {
      generated.push({
        label: "Priority Counselor Follow-up",
        badge: "Priority",
        priority: "high",
        message: `Hi ${fullName}, this is Zaifan Consultancy following up personally on your study abroad process. Let's move your case forward quickly.`,
      });
    }

    generated.push({
      label: "General Follow-up",
      badge: "Communication",
      priority: "normal",
      message: `Hi ${fullName}, just following up regarding your Zaifan Consultancy process. Let us know if you have any updates or questions.`,
    });

    return generated;
  }, [documents, tasks, universities, application, fullName, student?.priority]);

  const openWhatsApp = (message) => {
    const cleanPhone = phone.replace(/[^\d]/g, "");

    if (!cleanPhone) {
      alert("No phone number found for this student.");
      return;
    }

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const openEmail = (message) => {
    if (!email) {
      alert("No email found for this student.");
      return;
    }

    const subject = "Zaifan Consultancy Update";

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      email
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-[1.8rem] border-2 border-orange-300 bg-white p-6 shadow-[0_12px_30px_rgba(15,35,63,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
            Counselor Intelligence
          </p>

          <h3 className="mt-1 font-black text-[#10233f]">AI Smart Actions</h3>

          <p className="mt-2 text-sm text-slate-600">
            Dynamic counselor actions generated from live Student OS data.
          </p>
        </div>

        <span className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700">
          {actions.length} Actions
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {actions.map((action) => (
          <div
            key={`${action.label}-${action.badge}`}
            className={`rounded-xl border p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)] ${getActionStyle(
              action.priority
            )}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black text-[#10233f]">{action.label}</p>

              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                {action.badge}
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              {action.message}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openWhatsApp(action.message)}
                className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100"
              >
                WhatsApp
              </button>

              <button
                type="button"
                onClick={() => openEmail(action.message)}
                className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700 transition hover:border-orange-400 hover:bg-orange-100"
              >
                Email
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
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

  return "border-slate-300 bg-[#fffaf2]";
}

export default SmartActionsPanel;