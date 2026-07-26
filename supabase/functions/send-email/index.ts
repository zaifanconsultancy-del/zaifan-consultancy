const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const ADMIN_EMAIL = "zaifanconsultancy@gmail.com";
const FROM_EMAIL = "Zaifan Consultancy <updates@notifications.zaifanconsultancy.com>";
const WHATSAPP_NUMBER = "923305718131";
const WEBSITE_NAME = "Zaifan Consultancy";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type InquiryPayload = {
  full_name?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  country?: unknown;
  country_interest?: unknown;
  preferred_country?: unknown;
  field_of_interest?: unknown;
  field?: unknown;
  program?: unknown;
  study_level?: unknown;
  qualification?: unknown;
  current_qualification?: unknown;

  // Current Contact.jsx stores Intake Preference in counseling_mode.
  // Keep this backward-compatible until the public form/database schema
  // is migrated to a dedicated intake field.
  counseling_mode?: unknown;
  intake?: unknown;
  intake_preference?: unknown;
  preferred_intake?: unknown;

  preferred_date?: unknown;
  time_slot?: unknown;
  city?: unknown;
  message?: unknown;
  lead_source?: unknown;
  source?: unknown;
  status?: unknown;
};

function textValue(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const valueString = String(value).trim();
  return valueString || fallback;
}

function safeText(value: unknown, fallback = "Not provided"): string {
  return textValue(value, fallback)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeMultiline(value: unknown, fallback = "No message provided."): string {
  return safeText(value, fallback).replace(/\r?\n/g, "<br />");
}

function titleCaseSource(value: string): string {
  const cleaned = value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Website inquiry";

  return cleaned
    .split(" ")
    .map((word) =>
      word.length > 0
        ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
        : word
    )
    .join(" ");
}

function initials(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "ZS";
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td class="detail-label" style="padding:10px 0; width:42%; vertical-align:top; color:#64748b; font-size:13px; font-weight:700;">
        ${safeText(label)}
      </td>
      <td class="detail-value" style="padding:10px 0; vertical-align:top; color:#0b2b55; font-size:13px; font-weight:800; word-break:break-word;">
        ${value}
      </td>
    </tr>
  `;
}

async function readResendResponse(response: Response) {
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

  return readResendResponse(response);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed." }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY.");
    }

    let payload: InquiryPayload;

    try {
      payload = (await req.json()) as InquiryPayload;
    } catch {
      throw new Error("Invalid JSON request body.");
    }

    const rawEmail = textValue(payload.email).toLowerCase();

    if (!rawEmail) {
      throw new Error("Student email is required.");
    }

    const rawName = textValue(payload.full_name ?? payload.name, "Student");
    const rawPhone = textValue(payload.phone);
    const rawCountry = textValue(
      payload.country ?? payload.country_interest ?? payload.preferred_country,
      "Italy"
    );
    const rawField = textValue(
      payload.field_of_interest ?? payload.field ?? payload.program
    );
    const rawStudyLevel = textValue(
      payload.study_level ??
        payload.current_qualification ??
        payload.qualification
    );

    // New/future intake fields take priority. The current Contact form sends
    // formValues.intake as counseling_mode, so that remains the final fallback.
    const rawIntake = textValue(
      payload.intake_preference ??
        payload.preferred_intake ??
        payload.intake ??
        payload.counseling_mode
    );

    const rawCity = textValue(payload.city);
    const rawPreferredDate = textValue(payload.preferred_date);
    const rawTimeSlot = textValue(payload.time_slot);
    const rawMessage = textValue(payload.message, "No message provided.");
    const rawLeadSource = textValue(
      payload.lead_source ?? payload.source,
      "website_contact_italy"
    );

    const studentName = safeText(rawName);
    const studentEmail = safeText(rawEmail);
    const studentPhone = safeText(rawPhone);
    const preferredCountry = safeText(rawCountry);
    const field = safeText(rawField);
    const studyLevel = safeText(rawStudyLevel);
    const intakePreference = safeText(rawIntake);
    const studentCity = safeText(rawCity);
    const preferredDate = safeText(rawPreferredDate);
    const timeSlot = safeText(rawTimeSlot);
    const studentMessage = safeMultiline(rawMessage);
    const leadSource = safeText(titleCaseSource(rawLeadSource));

    const contactLink = rawPhone
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          `Hi ${rawName}, this is Zaifan Consultancy regarding your Italy study inquiry.`
        )}`
      : `mailto:${rawEmail}`;

    const adminEmailHtml = `
<!doctype html>
<html>
  <head>${EMAIL_RESPONSIVE_STYLES}</head>
  <body style="margin:0; padding:0; background:#f6efe5; font-family:Arial,Helvetica,sans-serif; color:#0b2b55;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      New Zaifan inquiry from ${studentName} for ${preferredCountry}.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6efe5; margin:0; padding:0;">
      <tr>
        <td align="center" class="email-outer" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
            class="email-card" style="max-width:720px; background:#fffdf8; border:1px solid #f1c99f; border-radius:28px; overflow:hidden; box-shadow:0 18px 50px rgba(11,43,85,0.10);">

            <tr>
              <td style="height:7px; background:#f97316; font-size:0; line-height:0;">&nbsp;</td>
            </tr>

            <tr>
              <td class="email-header" style="padding:30px 30px 22px;">
                <table role="presentation" class="mobile-stack" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="font-size:11px; font-weight:900; letter-spacing:2.2px; text-transform:uppercase; color:#f97316;">
                        ZAIFAN CONSULTANCY · NEW LEAD
                      </div>
                      <h1 class="email-title" style="margin:8px 0 0; color:#0b2b55; font-size:29px; line-height:1.2;">
                        New Italy Study Inquiry
                      </h1>
                      <p style="margin:10px 0 0; color:#64748b; font-size:14px; line-height:1.7;">
                        A fresh Italy study lead has entered Zaifan CRM. Review the profile, qualify the student, and make the first meaningful contact.
                      </p>
                    </td>
                    <td align="right" class="mobile-stack-right" style="width:74px; vertical-align:middle;">
                      <div class="mobile-avatar" style="width:58px; height:58px; line-height:58px; border-radius:18px; background:#0b2b55; color:#ffffff; text-align:center; font-size:19px; font-weight:900;">
                        ${safeText(initials(rawName))}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td class="email-section" style="padding:0 30px 18px;">
                <div class="email-box" style="background:#fff4e8; border:1px solid #fdba74; border-radius:20px; padding:17px 18px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td>
                        <div style="font-size:10px; font-weight:900; letter-spacing:1.7px; text-transform:uppercase; color:#c2410c;">
                          Lead Source
                        </div>
                        <div style="margin-top:5px; color:#0b2b55; font-size:14px; font-weight:900;">
                          ${leadSource}
                        </div>
                      </td>
                      <td align="right">
                        <span class="status-pill" style="display:inline-block; background:#f97316; color:#ffffff; border-radius:999px; padding:8px 12px; font-size:11px; font-weight:900;">
                          New Inquiry
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>

            <tr>
              <td class="email-section" style="padding:0 30px 18px;">
                <div class="email-box" style="border:1px solid #dbe5ef; border-radius:20px; padding:20px; background:#ffffff;">
                  <h2 style="margin:0 0 8px; color:#0b2b55; font-size:17px;">Student Details</h2>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    ${detailRow("Full Name", studentName)}
                    ${detailRow("Email", `<a href="mailto:${studentEmail}" style="color:#0b5db3; text-decoration:none;">${studentEmail}</a>`)}
                    ${detailRow("Phone", studentPhone)}
                    ${
                      rawCity
                        ? detailRow("City", studentCity)
                        : ""
                    }
                  </table>
                </div>
              </td>
            </tr>

            <tr>
              <td class="email-section" style="padding:0 30px 18px;">
                <div class="email-box" style="border:1px solid #f3cfa9; border-radius:20px; padding:20px; background:#fff9f2;">
                  <h2 style="margin:0 0 8px; color:#0b2b55; font-size:17px;">Italy Study Profile</h2>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    ${detailRow("Destination", preferredCountry)}
                    ${detailRow("Current Qualification", studyLevel)}
                    ${detailRow("Field of Interest", field)}
                    ${detailRow("Preferred Intake", intakePreference)}
                    ${
                      rawPreferredDate
                        ? detailRow("Preferred Consultation Date", preferredDate)
                        : ""
                    }
                    ${
                      rawTimeSlot
                        ? detailRow("Preferred Consultation Time", timeSlot)
                        : ""
                    }
                  </table>
                </div>
              </td>
            </tr>

            <tr>
              <td class="email-section" style="padding:0 30px 22px;">
                <div class="email-box" style="border:1px solid #dbe5ef; border-radius:20px; padding:20px; background:#f8fbff;">
                  <div style="font-size:10px; font-weight:900; letter-spacing:1.7px; text-transform:uppercase; color:#f97316;">
                    Student Goal / Message
                  </div>
                  <p style="margin:10px 0 0; color:#334155; font-size:14px; line-height:1.8;">
                    ${studentMessage}
                  </p>
                </div>

                <div style="margin-top:14px; border:1px solid #f3cfa9; border-radius:20px; padding:18px 20px; background:#fff9f2;">
                  <div style="font-size:10px; font-weight:900; letter-spacing:1.7px; text-transform:uppercase; color:#f97316;">
                    Recommended First Contact
                  </div>
                  <p style="margin:9px 0 0; color:#334155; font-size:13px; line-height:1.7;">
                    Confirm academic background, English status, budget range, target intake and document readiness. Then guide the student toward realistic Italy options.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td class="email-section" style="padding:0 30px 30px;">
                <a href="${contactLink}"
                  class="email-button" style="display:block; background:#f97316; color:#ffffff; text-decoration:none; text-align:center; padding:15px 18px; border-radius:15px; font-size:14px; font-weight:900;">
                  Contact Student on WhatsApp
                </a>
                <table role="presentation" class="mobile-actions" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:12px;">
                  <tr>
                    <td class="mobile-action-left" style="padding:0 5px 0 0;">
                      <a href="mailto:${studentEmail}" class="email-button" style="display:block; border:1px solid #dbe5ef; color:#0b2b55; text-decoration:none; text-align:center; padding:12px 10px; border-radius:13px; font-size:12px; font-weight:900; background:#ffffff;">
                        Email Student
                      </a>
                    </td>
                    <td class="mobile-action-right" style="padding:0 0 0 5px;">
                      <div style="border:1px solid #dbe5ef; color:#0b2b55; text-align:center; padding:12px 10px; border-radius:13px; font-size:12px; font-weight:900; background:#ffffff;">
                        Status · New Lead
                      </div>
                    </td>
                  </tr>
                </table>
                <p style="margin:13px 0 0; text-align:center; color:#64748b; font-size:11px; line-height:1.6;">
                  This email is an intake alert. Continue case management inside Zaifan CRM.
                </p>
              </td>
            </tr>

            <tr>
              <td class="email-footer" style="background:#0b2b55; padding:18px 30px; color:#ffffff;">
                <div style="font-size:12px; font-weight:900;">Zaifan Consultancy · CRM Intake</div>
                <div style="margin-top:4px; font-size:11px; color:#cbd5e1;">
                  Student-first guidance. No admission, scholarship or visa outcome is guaranteed.
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

    const studentEmailHtml = `
<!doctype html>
<html>
  <head>${EMAIL_RESPONSIVE_STYLES}</head>
  <body style="margin:0; padding:0; background:#f6efe5; font-family:Arial,Helvetica,sans-serif; color:#0b2b55;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      We received your Italy study-plan request at Zaifan Consultancy.
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6efe5;">
      <tr>
        <td align="center" class="email-outer" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
            class="email-card" style="max-width:720px; background:#fffdf8; border:1px solid #f1c99f; border-radius:28px; overflow:hidden; box-shadow:0 18px 50px rgba(11,43,85,0.10);">

            <tr>
              <td style="height:7px; background:#f97316; font-size:0; line-height:0;">&nbsp;</td>
            </tr>

            <tr>
              <td class="email-header" style="padding:34px 30px 24px; text-align:center;">
                <div style="display:inline-block; width:58px; height:58px; line-height:58px; border-radius:18px; background:#fff0df; color:#f97316; font-size:28px; font-weight:900;">
                  ✓
                </div>
                <div style="margin-top:18px; font-size:11px; font-weight:900; letter-spacing:2.2px; text-transform:uppercase; color:#f97316;">
                  ZAIFAN CONSULTANCY
                </div>
                <h1 class="email-title" style="margin:8px 0 0; color:#0b2b55; font-size:29px; line-height:1.25;">
                  We received your Italy study plan request
                </h1>
                <p style="margin:13px auto 0; max-width:580px; color:#64748b; font-size:14px; line-height:1.8;">
                  Thank you, ${studentName}. Your profile is now with the Zaifan team. We will review the information you submitted and contact you about the most useful next step.
                </p>
              </td>
            </tr>

            <tr>
              <td class="email-section" style="padding:0 30px 18px;">
                <div class="email-box" style="border:1px solid #f3cfa9; border-radius:20px; padding:20px; background:#fff9f2;">
                  <h2 style="margin:0 0 8px; color:#0b2b55; font-size:17px;">Your Submitted Study Profile</h2>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    ${detailRow("Destination", preferredCountry)}
                    ${detailRow("Current Qualification", studyLevel)}
                    ${detailRow("Field of Interest", field)}
                    ${detailRow("Preferred Intake", intakePreference)}
                    ${detailRow("Phone", studentPhone)}
                  </table>
                </div>
              </td>
            </tr>

            <tr>
              <td class="email-section" style="padding:0 30px 18px;">
                <div class="email-box" style="border:1px solid #dbe5ef; border-radius:20px; padding:20px; background:#ffffff;">
                  <h2 style="margin:0; color:#0b2b55; font-size:17px;">What happens next?</h2>

                  <div style="margin-top:16px;">
                    <div style="margin-bottom:12px;">
                      <span style="display:inline-block; width:26px; height:26px; line-height:26px; text-align:center; border-radius:9px; background:#0b2b55; color:#ffffff; font-size:12px; font-weight:900;">1</span>
                      <span style="margin-left:8px; color:#334155; font-size:13px; font-weight:800;">We review your study profile and goals.</span>
                    </div>
                    <div style="margin-bottom:12px;">
                      <span style="display:inline-block; width:26px; height:26px; line-height:26px; text-align:center; border-radius:9px; background:#0b2b55; color:#ffffff; font-size:12px; font-weight:900;">2</span>
                      <span style="margin-left:8px; color:#334155; font-size:13px; font-weight:800;">A counselor contacts you to collect any missing academic, English, budget or document details.</span>
                    </div>
                    <div>
                      <span style="display:inline-block; width:26px; height:26px; line-height:26px; text-align:center; border-radius:9px; background:#0b2b55; color:#ffffff; font-size:12px; font-weight:900;">3</span>
                      <span style="margin-left:8px; color:#334155; font-size:13px; font-weight:800;">We discuss realistic university, scholarship and application options based on your profile.</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td class="email-section" style="padding:0 30px 22px;">
                <div class="email-box" style="border:1px solid #dbe5ef; border-radius:20px; padding:20px; background:#f8fbff;">
                  <div style="font-size:10px; font-weight:900; letter-spacing:1.7px; text-transform:uppercase; color:#f97316;">
                    Your Message
                  </div>
                  <p style="margin:10px 0 0; color:#334155; font-size:14px; line-height:1.8;">
                    ${studentMessage}
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td class="email-section" style="padding:0 30px 30px;">
                <a href="https://wa.me/${WHATSAPP_NUMBER}"
                  class="email-button" style="display:block; background:#f97316; color:#ffffff; text-decoration:none; text-align:center; padding:15px 18px; border-radius:15px; font-size:14px; font-weight:900;">
                  Message Zaifan on WhatsApp
                </a>

                <p style="margin:16px 0 0; color:#64748b; font-size:12px; line-height:1.7; text-align:center;">
                  You do not need to submit another inquiry or appointment form unless you specifically want to book a consultation time. Your current inquiry is already in our system.
                </p>
              </td>
            </tr>

            <tr>
              <td class="email-footer" style="background:#0b2b55; padding:22px 30px; color:#ffffff;">
                <div style="font-size:13px; font-weight:900;">Zaifan Consultancy Team</div>
                <div style="margin-top:5px; color:#cbd5e1; font-size:11px; line-height:1.6;">
                  Pakistan · WhatsApp 03305718131
                </div>
                <div style="margin-top:8px; color:#94a3b8; font-size:10px; line-height:1.6;">
                  We provide guidance based on your profile. Admission, scholarship and visa decisions remain with the relevant institutions and authorities.
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

    const [adminResult, studentResult] = await Promise.all([
      sendEmail({
        to: [ADMIN_EMAIL],
        subject: `New Italy Study Inquiry · ${rawName}`,
        html: adminEmailHtml,
      }),
      sendEmail({
        to: [rawEmail],
        subject: "Your Italy study plan request is with Zaifan",
        html: studentEmailHtml,
      }),
    ]);

    if (!adminResult.ok || !studentResult.ok) {
      console.error("Resend inquiry email failure", {
        adminResult,
        studentResult,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "One or more inquiry emails could not be sent.",
          adminEmail: adminResult,
          studentEmail: studentResult,
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        adminEmail: adminResult,
        studentEmail: studentResult,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("send-email failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
