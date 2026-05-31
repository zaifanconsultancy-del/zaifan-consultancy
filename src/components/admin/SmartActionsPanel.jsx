import { useMemo } from "react";

function SmartActionsPanel({ student = {} }) {
  const fullName = student?.full_name || student?.name || "Student";
  const phone = student?.phone || student?.phone_number || "";
  const email = student?.email || "";

  const actions = useMemo(
    () => [
      {
        label: "Request Passport",
        message: `Hi ${fullName}, please send your passport copy so we can continue your application process.`,
      },
      {
        label: "Request IELTS",
        message: `Hi ${fullName}, please share your IELTS/PTE result if available.`,
      },
      {
        label: "Schedule Consultation",
        message: `Hi ${fullName}, let's schedule a consultation to discuss your study abroad options.`,
      },
      {
        label: "Application Update",
        message: `Hi ${fullName}, we are reviewing your application progress and will update you shortly.`,
      },
      {
        label: "Start Visa Process",
        message: `Hi ${fullName}, your profile is ready for visa process review. Please prepare your financial and academic documents.`,
      },
      {
        label: "Generate Follow-up",
        message: `Hi ${fullName}, just following up regarding your Zaifan Consultancy process.`,
      },
    ],
    [fullName]
  );

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
      <h3 className="font-bold text-white">AI Smart Actions</h3>

      <p className="mt-2 text-sm text-white/50">
        Fast counselor actions based on this student profile.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {actions.map((action) => (
          <div
            key={action.label}
            className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4"
          >
            <p className="font-semibold text-[#D4AF37]">{action.label}</p>

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

export default SmartActionsPanel;