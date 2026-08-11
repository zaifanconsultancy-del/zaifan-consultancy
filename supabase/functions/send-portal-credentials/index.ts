const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const FROM_EMAIL =
  "Zaifan Consultancy <updates@notifications.zaifanconsultancy.com>";
const WEBSITE_URL = "https://zaifanconsultancy.com";
const STUDENT_PORTAL_URL = `${WEBSITE_URL}/student`;
const WHATSAPP_URL = "https://wa.me/923305718131";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PortalCredentialsPayload = {
  studentName?: unknown;
  recipientEmail?: unknown;
  temporaryPassword?: unknown;
  mustChangePassword?: unknown;
  studentId?: unknown;
  studentType?: unknown;
  accountId?: unknown;
  action?: unknown;
};

const text = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  const result = String(value).trim();
  return result || fallback;
};

const escapeHtml = (value: unknown, fallback = "") =>
  text(value, fallback)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function canonicalPayload(payload: PortalCredentialsPayload = {}) {
  return {
    studentName: text(payload.studentName, "Student"),
    recipientEmail: text(payload.recipientEmail).toLowerCase(),
    temporaryPassword: text(payload.temporaryPassword),
    mustChangePassword:
      typeof payload.mustChangePassword === "boolean"
        ? payload.mustChangePassword
        : true,
    studentId:
      payload.studentId === null || payload.studentId === undefined
        ? null
        : String(payload.studentId),
    studentType: text(payload.studentType, "inquiry"),
    accountId:
      payload.accountId === null || payload.accountId === undefined
        ? null
        : String(payload.accountId),
    action: text(payload.action, "create").toLowerCase(),
  };
}

function validatePayload(payload: ReturnType<typeof canonicalPayload>) {
  if (
    !payload.recipientEmail ||
    !payload.recipientEmail.includes("@")
  ) {
    throw new Error("A valid student email is required.");
  }

  if (!payload.temporaryPassword) {
    throw new Error("Temporary password is required.");
  }

  if (payload.temporaryPassword.length < 10) {
    throw new Error(
      "Temporary password must contain at least 10 characters."
    );
  }

  if (!["create", "reset", "resend"].includes(payload.action)) {
    throw new Error("Unsupported portal credential action.");
  }
}

async function getAuthenticatedAdmin(req: Request) {
  const authorization = req.headers.get("Authorization") || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    throw new Error("Authentication required.");
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase authentication environment is unavailable."
    );
  }

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!userResponse.ok) {
    throw new Error(
      "Authenticated Admin session could not be verified."
    );
  }

  const user = await userResponse.json();

  if (!user?.id) {
    throw new Error("Authenticated user could not be resolved.");
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    throw new Error("Admin verification environment is unavailable.");
  }

  const profileResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(
      user.id
    )}&select=id,role&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );

  if (!profileResponse.ok) {
    throw new Error("Admin profile verification failed.");
  }

  const profiles = await profileResponse.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  const role = text(profile?.role).toLowerCase();

  if (
    !profile?.id ||
    !["staff", "admin", "super_admin"].includes(role)
  ) {
    throw new Error(
      "This account is not authorised to send portal credentials."
    );
  }

  return {
    userId: user.id,
    role,
  };
}

async function logPortalCredentialEmail({
  payload,
  adminUserId,
  messageId,
}: {
  payload: ReturnType<typeof canonicalPayload>;
  adminUserId: string;
  messageId: string | null;
}) {
  if (
    !SUPABASE_URL ||
    payload.studentId === null ||
    payload.studentId === undefined
  ) {
    return {
      logged: false,
      warning:
        "Email sent, but no student ID was available for Communication history.",
    };
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    return {
      logged: false,
      warning:
        "Email sent, but Communication history logging is unavailable.",
    };
  }

  const actionLabel =
    payload.action === "reset"
      ? "Portal password reset credentials"
      : payload.action === "resend"
      ? "Portal credentials resent"
      : "Portal account credentials";

  const now = new Date().toISOString();

  const communicationPayload = {
    student_id: payload.studentId,
    student_type: payload.studentType,
    channel: "email",
    direction: "outbound",
    subject: "Your Zaifan Student Portal Access",
    message: `${actionLabel} were emailed to the student.`,
    status: "sent",
    source: "portal_credentials_system",
    sent_at: now,
    related_type: "student_portal_account",
    related_id: payload.accountId,
    metadata: {
      portal_action: payload.action,
      provider_message_id: messageId,
      sent_by_admin_user_id: adminUserId,
      delivery_engine: "resend",
      included_temporary_password: true,
      must_change_password: payload.mustChangePassword,
    },
  };

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/student_communications`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(communicationPayload),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");

    console.warn(
      "Portal credential communication logging failed:",
      response.status,
      detail
    );

    return {
      logged: false,
      warning:
        "Email sent, but its Communication history entry could not be saved.",
    };
  }

  return {
    logged: true,
    warning: "",
  };
}

async function sendPortalCredentialsEmail(
  payload: ReturnType<typeof canonicalPayload>
) {
  if (!RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  const actionTitle =
    payload.action === "reset"
      ? "Your Portal Password Was Reset"
      : payload.action === "resend"
      ? "Your Portal Login Details"
      : "Your Student Portal Is Ready";

  const actionCopy =
    payload.action === "reset"
      ? "Your Zaifan Student Portal password has been reset by the Zaifan team."
      : payload.action === "resend"
      ? "Your Zaifan Student Portal login details are shown below."
      : "Your Zaifan Student Portal account has been created and is ready to use.";

  const passwordNotice = payload.mustChangePassword
    ? "For your security, you will be asked to create a new private password after signing in."
    : "You can update your password anytime from the Password & Access section inside your portal.";

  const html = `
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }

    body, table, td, a, p, h1, h2, div, span {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table { border-collapse: separate; }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }

    @media only screen and (max-width: 620px) {
      .outer { padding: 10px 6px !important; }
      .card { width: 100% !important; border-radius: 20px !important; }
      .header { padding: 28px 18px 20px !important; }
      .section { padding-left: 14px !important; padding-right: 14px !important; }
      .footer { padding: 18px !important; }
      .title { font-size: 25px !important; line-height: 1.2 !important; }
      .copy { font-size: 14px !important; line-height: 1.75 !important; }
      .button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background:#f5eee5;font-family:Arial,Helvetica,sans-serif;color:#10233f;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your Zaifan Student Portal login details are ready.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5eee5;">
    <tr>
      <td align="center" class="outer" style="padding:30px 14px;">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          class="card"
          style="max-width:700px;background:#fffdf9;border:1px solid #efc79e;border-radius:30px;overflow:hidden;box-shadow:0 20px 54px rgba(16,35,63,0.10);"
        >
          <tr>
            <td style="height:7px;background:#ff5a0a;font-size:0;line-height:0;">
              &nbsp;
            </td>
          </tr>

          <tr>
            <td class="header" style="padding:36px 30px 24px;text-align:center;">
              <div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#fff4e8;border:1px solid #fdba74;color:#ff5a0a;font-size:9px;font-weight:900;letter-spacing:1.7px;text-transform:uppercase;">
                Zaifan Consultancy · Secure Student Access
              </div>

              <h1 class="title" style="margin:16px auto 0;max-width:580px;color:#10233f;font-size:30px;line-height:1.22;">
                ${escapeHtml(actionTitle)}
              </h1>

              <p style="margin:12px auto 0;max-width:560px;color:#667085;font-size:14px;line-height:1.75;">
                Hello ${escapeHtml(payload.studentName)},
              </p>

              <p class="copy" style="margin:10px auto 0;max-width:560px;color:#475467;font-size:14px;line-height:1.75;font-weight:600;">
                ${escapeHtml(actionCopy)}
              </p>
            </td>
          </tr>

          <tr>
            <td class="section" style="padding:0 30px 16px;">
              <div style="border:1px solid #d5dce6;border-radius:20px;padding:20px;background:#ffffff;">
                <div style="font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#667085;">
                  Portal Email
                </div>

                <div style="margin-top:8px;color:#10233f;font-size:15px;font-weight:900;line-height:1.6;word-break:break-word;">
                  ${escapeHtml(payload.recipientEmail)}
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td class="section" style="padding:0 30px 16px;">
              <div style="border:2px solid #ff5a0a;border-radius:20px;padding:20px;background:#fff4e8;">
                <div style="font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#ff5a0a;">
                  Temporary Password
                </div>

                <div style="margin-top:10px;color:#10233f;font-family:Consolas,Monaco,monospace;font-size:19px;font-weight:900;line-height:1.5;letter-spacing:0.4px;word-break:break-all;">
                  ${escapeHtml(payload.temporaryPassword)}
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td class="section" style="padding:0 30px 16px;">
              <div style="border:1px solid #bfd1e3;border-radius:18px;padding:17px;background:#f8fbff;">
                <div style="font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#123865;">
                  Security Notice
                </div>

                <p style="margin:8px 0 0;color:#475467;font-size:13px;line-height:1.75;font-weight:600;">
                  ${escapeHtml(passwordNotice)}
                  Do not share this password with anyone other than an authorised Zaifan team member assisting with your account.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td class="section" style="padding:0 30px 24px;">
              <a
                href="${STUDENT_PORTAL_URL}"
                class="button"
                style="display:block;background:#ff5a0a;color:#ffffff;text-decoration:none;text-align:center;padding:15px 16px;border-radius:14px;font-size:13px;font-weight:900;"
              >
                Open Student Portal
              </a>

              <p style="margin:13px 0 0;text-align:center;color:#667085;font-size:11px;line-height:1.65;">
                Portal address:
                <span style="color:#123865;font-weight:900;">
                  ${STUDENT_PORTAL_URL}
                </span>
              </p>
            </td>
          </tr>

          <tr>
            <td class="section" style="padding:0 30px 30px;">
              <div style="border-top:1px solid #e4e7ec;padding-top:18px;text-align:center;">
                <p style="margin:0;color:#667085;font-size:11px;line-height:1.7;">
                  Having trouble signing in?
                  <a href="${WHATSAPP_URL}" style="color:#ff5a0a;font-weight:900;text-decoration:none;">
                    Contact Zaifan on WhatsApp
                  </a>
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td class="footer" style="background:#123865;padding:19px 30px;color:#ffffff;">
              <div style="font-size:12px;font-weight:900;">
                Zaifan Consultancy
              </div>

              <div style="margin-top:4px;font-size:11px;line-height:1.55;color:#dbeafe;">
                Secure Student Portal Access · zaifanconsultancy.com
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [payload.recipientEmail],
      subject: "Your Zaifan Student Portal Access",
      html,
    }),
  });

  let body: any = null;

  try {
    body = await response.json();
  } catch {
    body = await response.text().catch(() => null);
  }

  if (!response.ok) {
    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : `Resend returned HTTP ${response.status}.`
    );
  }

  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Method not allowed.",
      },
      405
    );
  }

  try {
    const admin = await getAuthenticatedAdmin(req);

    let body: PortalCredentialsPayload;

    try {
      body = (await req.json()) as PortalCredentialsPayload;
    } catch {
      throw new Error("Invalid JSON request body.");
    }

    const payload = canonicalPayload(body);
    validatePayload(payload);

    const resend = await sendPortalCredentialsEmail(payload);
    const messageId = resend?.id || null;

    const communication = await logPortalCredentialEmail({
      payload,
      adminUserId: admin.userId,
      messageId,
    });

    return jsonResponse({
      success: true,
      messageId,
      communicationLogged: communication.logged,
      communicationWarning: communication.warning,
      message:
        payload.action === "reset"
          ? "New portal credentials emailed successfully."
          : payload.action === "resend"
          ? "Portal credentials resent successfully."
          : "Portal credentials emailed successfully.",
    });
  } catch (error) {
    console.error("send-portal-credentials failed:", error);

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Portal credentials email failed.",
      },
      400
    );
  }
});
