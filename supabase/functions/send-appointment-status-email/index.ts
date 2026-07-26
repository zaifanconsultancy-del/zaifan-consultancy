import "@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const FROM_EMAIL = "Zaifan Consultancy <updates@notifications.zaifanconsultancy.com>";
const WHATSAPP_NUMBER = "923305718131";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AppointmentStatusPayload = {
  full_name?: unknown;
  fullName?: unknown;
  name?: unknown;

  email?: unknown;
  phone?: unknown;

  country_interest?: unknown;
  country?: unknown;

  consultation_type?: unknown;
  consultationType?: unknown;
  service?: unknown;

  appointment_date?: unknown;
  appointmentDate?: unknown;

  appointment_time?: unknown;
  appointmentTime?: unknown;

  status?: unknown;
  appointment_status?: unknown;

  previous_status?: unknown;
  previousStatus?: unknown;

  message?: unknown;
  note?: unknown;
  admin_note?: unknown;
};

function textValue(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const result = String(value).trim();
  return result || fallback;
}

function escapeHtml(value: unknown, fallback = "Not provided"): string {
  return textValue(value, fallback)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function humanDate(value: string): string {
  if (!value) return "Not provided";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return escapeHtml(value);

  try {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return escapeHtml(value);
  }
}

function normalizeStatus(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ").trim();
}

function statusPresentation(status: string) {
  const value = normalizeStatus(status);

  if (value.includes("cancel")) {
    return {
      label: "Cancelled",
      subject: "Update about your Zaifan consultation",
      heading: "Your consultation has been cancelled",
      badgeBackground: "#fff1f2",
      badgeBorder: "#fecdd3",
      badgeText: "#be123c",
      intro:
        "Your Zaifan consultation request has been cancelled. If this was unexpected or you would like another slot, please contact our team.",
      guidance:
        "You can message Zaifan to discuss a new consultation time. Your existing student information remains in our system, so you do not need to start again.",
    };
  }

  if (value.includes("resched") || value.includes("update") || value.includes("change")) {
    return {
      label: "Updated",
      subject: "Your Zaifan consultation has been updated",
      heading: "Your consultation details have been updated",
      badgeBackground: "#fff7ed",
      badgeBorder: "#fdba74",
      badgeText: "#c2410c",
      intro:
        "There has been an update to your Zaifan consultation. Please review the date and time below.",
      guidance:
        "Please use the latest details in this email. Contact our team if the updated slot is not suitable.",
    };
  }

  if (
    value.includes("complete") ||
    value.includes("done") ||
    value.includes("closed")
  ) {
    return {
      label: "Completed",
      subject: "Your Zaifan consultation is complete",
      heading: "Your consultation has been completed",
      badgeBackground: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      badgeText: "#047857",
      intro:
        "Your Zaifan consultation has been marked as completed. Your counselor can now continue the next step in your student journey.",
      guidance:
        "Keep an eye on your email, WhatsApp and Student Portal for document, university, application or follow-up actions.",
    };
  }

  return {
    label: "Confirmed",
    subject: "Your Zaifan consultation is confirmed",
    heading: "Your consultation is confirmed",
    badgeBackground: "#ecfdf5",
    badgeBorder: "#a7f3d0",
    badgeText: "#047857",
    intro:
      "Your Zaifan consultation has been confirmed. Please review the confirmed date and time below.",
    guidance:
      "Please be available at the confirmed time. Our team will contact you through the details you provided if any additional instructions are required.",
  };
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td class="detail-label" style="padding:10px 0;width:42%;vertical-align:top;color:#64748b;font-size:13px;font-weight:700;">
        ${escapeHtml(label)}
      </td>
      <td class="detail-value" style="padding:10px 0;vertical-align:top;color:#0b2b55;font-size:13px;font-weight:800;word-break:break-word;">
        ${value}
      </td>
    </tr>
  `;
}


const EMAIL_RESPONSIVE_STYLES = `
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    body, table, td, a, p, h1, h2, div, span { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: separate; }
    img { border: 0; outline: none; text-decoration: none; max-width: 100%; height: auto; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }

    @media only screen and (max-width: 600px) {
      .email-outer { padding: 10px 6px !important; }
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 18px !important; }
      .email-header { padding: 22px 16px 16px !important; }
      .email-section { padding-left: 14px !important; padding-right: 14px !important; }
      .email-footer { padding: 17px 16px !important; }
      .email-box { padding: 16px !important; border-radius: 16px !important; }
      .email-title { font-size: 24px !important; line-height: 1.18 !important; }
      .email-copy { font-size: 14px !important; line-height: 1.65 !important; }
      .email-kicker { font-size: 9px !important; letter-spacing: 1.45px !important; }
      .mobile-stack, .mobile-stack > tbody, .mobile-stack > tbody > tr, .mobile-stack > tbody > tr > td {
        display: block !important;
        width: 100% !important;
      }
      .mobile-stack-right { text-align: left !important; padding-top: 12px !important; }
      .mobile-hide { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .mobile-avatar {
        width: 46px !important;
        height: 46px !important;
        line-height: 46px !important;
        border-radius: 14px !important;
        font-size: 16px !important;
      }
      .detail-label {
        display: block !important;
        width: 100% !important;
        padding: 8px 0 2px !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
      }
      .detail-value {
        display: block !important;
        width: 100% !important;
        padding: 0 0 9px !important;
        font-size: 14px !important;
        line-height: 1.45 !important;
        word-break: break-word !important;
      }
      .mobile-actions, .mobile-actions > tbody, .mobile-actions > tbody > tr, .mobile-actions > tbody > tr > td {
        display: block !important;
        width: 100% !important;
      }
      .mobile-action-left, .mobile-action-right { padding: 0 !important; }
      .mobile-action-right { margin-top: 8px !important; }
      .email-button {
        box-sizing: border-box !important;
        width: 100% !important;
        padding: 14px 14px !important;
        font-size: 14px !important;
        line-height: 1.35 !important;
      }
      .email-note { font-size: 12px !important; line-height: 1.55 !important; }
      .status-pill { font-size: 10px !important; padding: 7px 10px !important; }
    }
  </style>
`;

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string[];
  subject: string;
  html: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = await response.text().catch(() => null);
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY.");
    }

    let body: AppointmentStatusPayload;

    try {
      body = (await req.json()) as AppointmentStatusPayload;
    } catch {
      throw new Error("Invalid JSON request body.");
    }

    const rawName = textValue(body.full_name ?? body.fullName ?? body.name, "Student");
    const rawEmail = textValue(body.email).toLowerCase();
    const rawPhone = textValue(body.phone);
    const rawCountry = textValue(body.country_interest ?? body.country, "Italy");
    const rawConsultationType = textValue(
      body.consultation_type ?? body.consultationType ?? body.service,
      "Study Consultation"
    );
    const rawDate = textValue(body.appointment_date ?? body.appointmentDate);
    const rawTime = textValue(body.appointment_time ?? body.appointmentTime);
    const rawStatus = textValue(
      body.status ?? body.appointment_status,
      "confirmed"
    );
    const rawNote = textValue(body.note ?? body.admin_note ?? body.message);

    if (!rawEmail) {
      throw new Error("Student email is required.");
    }

    const presentation = statusPresentation(rawStatus);

    const studentName = escapeHtml(rawName);
    const phone = escapeHtml(rawPhone);
    const country = escapeHtml(rawCountry);
    const consultationType = escapeHtml(rawConsultationType);
    const appointmentDate = humanDate(rawDate);
    const appointmentTime = escapeHtml(rawTime);
    const statusLabel = escapeHtml(presentation.label);
    const note = escapeHtml(rawNote);

    const html = `
<!doctype html>
<html>
<head>${EMAIL_RESPONSIVE_STYLES}</head>
<body style="margin:0;padding:0;background:#f6efe5;font-family:Arial,Helvetica,sans-serif;color:#0b2b55;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(presentation.heading)}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6efe5;">
    <tr>
      <td align="center" class="email-outer" style="padding:28px 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          class="email-card" style="max-width:720px;background:#fffdf8;border:1px solid #f1c99f;border-radius:28px;overflow:hidden;box-shadow:0 18px 50px rgba(11,43,85,0.10);">

          <tr>
            <td style="height:7px;background:#f97316;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td class="email-header" style="padding:34px 30px 22px;text-align:center;">
              <div style="font-size:11px;font-weight:900;letter-spacing:2.2px;text-transform:uppercase;color:#f97316;">
                ZAIFAN CONSULTANCY · APPOINTMENT UPDATE
              </div>
              <h1 class="email-title" style="margin:9px 0 0;color:#0b2b55;font-size:29px;line-height:1.25;">
                ${escapeHtml(presentation.heading)}
              </h1>
              <p style="margin:13px auto 0;max-width:580px;color:#64748b;font-size:14px;line-height:1.8;">
                Dear ${studentName}, ${escapeHtml(presentation.intro)}
              </p>

              <div class="status-pill" style="display:inline-block;margin-top:17px;padding:8px 14px;border-radius:999px;background:${presentation.badgeBackground};border:1px solid ${presentation.badgeBorder};color:${presentation.badgeText};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">
                ${statusLabel}
              </div>
            </td>
          </tr>

          <tr>
            <td class="email-section" style="padding:0 30px 18px;">
              <div class="email-box" style="border:1px solid #f3cfa9;border-radius:20px;padding:20px;background:#fff9f2;">
                <h2 style="margin:0 0 8px;color:#0b2b55;font-size:17px;">Consultation Details</h2>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  ${detailRow("Status", statusLabel)}
                  ${detailRow("Date", appointmentDate)}
                  ${detailRow("Time", appointmentTime)}
                  ${detailRow("Consultation Type", consultationType)}
                  ${detailRow("Destination", country)}
                  ${rawPhone ? detailRow("Phone", phone) : ""}
                </table>
              </div>
            </td>
          </tr>

          ${
            rawNote
              ? `
          <tr>
            <td class="email-section" style="padding:0 30px 18px;">
              <div class="email-box" style="border:1px solid #dbe5ef;border-radius:20px;padding:20px;background:#f8fbff;">
                <div style="font-size:10px;font-weight:900;letter-spacing:1.7px;text-transform:uppercase;color:#f97316;">
                  Zaifan Note
                </div>
                <p style="margin:10px 0 0;color:#334155;font-size:13px;line-height:1.8;">${note}</p>
              </div>
            </td>
          </tr>
              `
              : ""
          }

          <tr>
            <td class="email-section" style="padding:0 30px 18px;">
              <div class="email-box" style="border:1px solid #dbe5ef;border-radius:20px;padding:20px;background:#fff;">
                <h2 style="margin:0;color:#0b2b55;font-size:17px;">What you should do now</h2>
                <p style="margin:12px 0 0;color:#334155;font-size:13px;line-height:1.8;">
                  ${escapeHtml(presentation.guidance)}
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td class="email-section" style="padding:0 30px 30px;">
              <a href="https://wa.me/${WHATSAPP_NUMBER}"
                class="email-button" style="display:block;background:#f97316;color:#fff;text-decoration:none;text-align:center;padding:15px 18px;border-radius:15px;font-size:14px;font-weight:900;">
                Contact Zaifan on WhatsApp
              </a>
              <p style="margin:14px 0 0;text-align:center;color:#64748b;font-size:11px;line-height:1.7;">
                Pakistan · WhatsApp 03305718131
              </p>
            </td>
          </tr>

          <tr>
            <td class="email-footer" style="background:#0b2b55;padding:22px 30px;color:#fff;">
              <div style="font-size:13px;font-weight:900;">Zaifan Consultancy Team</div>
              <div style="margin-top:7px;color:#94a3b8;font-size:10px;line-height:1.6;">
                This message reflects the latest appointment status recorded by Zaifan.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const result = await sendEmail({
      to: [rawEmail],
      subject: presentation.subject,
      html,
    });

    if (!result.ok) {
      console.error("Appointment status email delivery failure", result);
    }

    return new Response(
      JSON.stringify({
        success: result.ok,
        studentEmail: result,
        error: result.ok ? null : "Appointment status email could not be delivered.",
      }),
      {
        status: result.ok ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("send-appointment-status-email failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
