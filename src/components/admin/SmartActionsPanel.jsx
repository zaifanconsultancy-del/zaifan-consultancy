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
    <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.03] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-white">AI Smart Actions</h3>

          <p className="mt-2 text-sm text-white/50">
            Dynamic counselor actions generated from live Student OS data.
          </p>
        </div>

        <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black text-[#D4AF37]">
          {actions.length} Actions
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {actions.map((action) => (
          <div
            key={`${action.label}-${action.badge}`}
            className={`rounded-xl border p-4 ${getActionStyle(
              action.priority
            )}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-white">{action.label}</p>

              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                {action.badge}
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-white/55">
              {action.message}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openWhatsApp(action.message)}
                className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 transition hover:border-emerald-400/40"
              >
                WhatsApp
              </button>

              <button
                type="button"
                onClick={() => openEmail(action.message)}
                className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37] transition hover:border-[#D4AF37]/40"
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
    return "border-red-400/25 bg-red-500/10";
  }

  if (priority === "high") {
    return "border-orange-400/25 bg-orange-500/10";
  }

  if (priority === "medium") {
    return "border-blue-400/25 bg-blue-500/10";
  }

  return "border-[#D4AF37]/20 bg-[#D4AF37]/10";
}

export default SmartActionsPanel;