const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SIGNING_SECRET =
  Deno.env.get("STUDENT_NOTIFICATION_SIGNING_SECRET") ||
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const FROM_EMAIL = "Zaifan Consultancy <updates@notifications.zaifanconsultancy.com>";
const TOKEN_TTL_MS = 10 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NotificationPayload = {
  eventType?: unknown;
  eventLabel?: unknown;
  risk?: unknown;
  subject?: unknown;
  message?: unknown;
  trigger?: unknown;
  recipientName?: unknown;
  recipientEmail?: unknown;
  studentId?: unknown;
  studentType?: unknown;
  relatedType?: unknown;
  relatedId?: unknown;
  confirmationPhrase?: unknown;
};

type RequestBody = {
  mode?: unknown;
  notification?: NotificationPayload;
  previewToken?: unknown;
  confirmationText?: unknown;
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

const multiline = (value: unknown) => escapeHtml(value).replace(/\r?\n/g, "<br />");

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const fromBase64Url = (value: string) => {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return new Uint8Array([...binary].map((char) => char.charCodeAt(0)));
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function hmac(value: string) {
  if (!SIGNING_SECRET) throw new Error("Missing notification signing secret.");

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SIGNING_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

async function sha256(value: string) {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

function canonicalNotification(notification: NotificationPayload = {}) {
  return {
    eventType: text(notification.eventType),
    eventLabel: text(notification.eventLabel),
    risk: text(notification.risk, "normal").toLowerCase(),
    subject: text(notification.subject),
    message: text(notification.message),
    trigger: text(notification.trigger),
    recipientName: text(notification.recipientName, "Student"),
    recipientEmail: text(notification.recipientEmail).toLowerCase(),
    studentId: notification.studentId ?? null,
    studentType: text(notification.studentType, "inquiry"),
    relatedType: text(notification.relatedType),
    relatedId: notification.relatedId ?? null,
    confirmationPhrase: text(notification.confirmationPhrase),
  };
}

function validateNotification(notification: ReturnType<typeof canonicalNotification>) {
  if (!notification.recipientEmail || !notification.recipientEmail.includes("@")) {
    throw new Error("A valid student email is required.");
  }
  if (!notification.subject) throw new Error("Email subject is required.");
  if (!notification.message) throw new Error("Email message is required.");
  if (!notification.eventType) throw new Error("Notification event type is required.");
}

async function getAuthenticatedUser(req: Request) {
  const authorization = req.headers.get("Authorization") || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    throw new Error("Authentication required.");
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase authentication environment is unavailable.");
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) throw new Error("Authenticated Admin session could not be verified.");

  const user = await response.json();
  if (!user?.id) throw new Error("Authenticated user could not be resolved.");

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) throw new Error("Admin verification environment is unavailable.");

  const profileResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(user.id)}&select=id,role&limit=1`,
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

  if (!profile?.id || !["staff", "admin", "super_admin"].includes(text(profile.role).toLowerCase())) {
    throw new Error("This account is not authorised to send student notifications.");
  }

  return { ...user, adminRole: profile.role };
}

async function createPreviewToken(notification: ReturnType<typeof canonicalNotification>, userId: string) {
  const canonical = JSON.stringify(notification);
  const payload = {
    uid: userId,
    hash: await sha256(canonical),
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const payloadEncoded = toBase64Url(payloadBytes);
  const signature = toBase64Url(await hmac(payloadEncoded));

  return {
    token: `${payloadEncoded}.${signature}`,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}

async function verifyPreviewToken(
  token: string,
  notification: ReturnType<typeof canonicalNotification>,
  userId: string
) {
  const [payloadEncoded, signatureEncoded] = token.split(".");
  if (!payloadEncoded || !signatureEncoded) throw new Error("Invalid preview token.");

  const expectedSignature = toBase64Url(await hmac(payloadEncoded));
  if (signatureEncoded !== expectedSignature) throw new Error("Preview token signature is invalid.");

  const payload = JSON.parse(decoder.decode(fromBase64Url(payloadEncoded)));
  if (!payload?.uid || payload.uid !== userId) throw new Error("Preview token belongs to another session.");
  if (!payload?.exp || Number(payload.exp) < Date.now()) throw new Error("Preview expired. Open the notification preview again.");

  const currentHash = await sha256(JSON.stringify(notification));
  if (payload.hash !== currentHash) throw new Error("Notification changed after preview. Review it again before sending.");
}

const WEBSITE_URL = "https://zaifanconsultancy.com";
const STUDENT_PORTAL_URL = `${WEBSITE_URL}/student`;
const WHATSAPP_URL = "https://wa.me/923305718131";
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function notificationFingerprint(
  notification: ReturnType<typeof canonicalNotification>
) {
  return sha256(
    JSON.stringify({
      eventType: notification.eventType,
      recipientEmail: notification.recipientEmail,
      studentId: notification.studentId,
      studentType: notification.studentType,
      relatedType: notification.relatedType,
      relatedId: notification.relatedId,
      subject: notification.subject,
      message: notification.message,
    })
  );
}

async function findRecentDuplicate(
  notification: ReturnType<typeof canonicalNotification>,
  fingerprint: string
) {
  if (!SUPABASE_URL || notification.studentId === null || notification.studentId === undefined) {
    return null;
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) return null;

  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
  const params = new URLSearchParams();
  params.set("student_id", `eq.${String(notification.studentId)}`);
  params.set("student_type", `eq.${notification.studentType}`);
  params.set("channel", "eq.email");
  params.set("created_at", `gte.${since}`);
  params.set("metadata->>notification_fingerprint", `eq.${fingerprint}`);
  params.set("select", "id,created_at,metadata");
  params.set("order", "created_at.desc");
  params.set("limit", "1");

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/student_communications?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    }
  );

  if (!response.ok) {
    console.warn("Duplicate notification lookup skipped:", response.status);
    return null;
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function logCommunication({
  notification,
  fingerprint,
  messageId,
  adminUserId,
}: {
  notification: ReturnType<typeof canonicalNotification>;
  fingerprint: string;
  messageId: string | null;
  adminUserId: string;
}) {
  if (!SUPABASE_URL || notification.studentId === null || notification.studentId === undefined) {
    return {
      logged: false,
      warning: "Email sent, but no student ID was available for Communication history.",
    };
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    return {
      logged: false,
      warning: "Email sent, but server-side Communication history logging is unavailable.",
    };
  }

  const now = new Date().toISOString();
  const payload = {
    student_id: notification.studentId,
    student_type: notification.studentType,
    channel: "email",
    direction: "outbound",
    subject: notification.subject,
    message: notification.message,
    status: "sent",
    source: "student_notification_system",
    sent_at: now,
    related_type: notification.relatedType || null,
    related_id:
      notification.relatedId === null || notification.relatedId === undefined
        ? null
        : String(notification.relatedId),
    metadata: {
      event_type: notification.eventType,
      event_label: notification.eventLabel,
      trigger: notification.trigger,
      risk: notification.risk,
      provider_message_id: messageId,
      notification_fingerprint: fingerprint,
      sent_by_admin_user_id: adminUserId,
      delivery_engine: "resend",
      safety_preview_verified: true,
    },
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/student_communications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.warn("Student communication logging failed:", response.status, detail);
    return {
      logged: false,
      warning: "Email sent, but the Communication history entry could not be saved.",
    };
  }

  return { logged: true, warning: "" };
}

async function logFailedCommunication({
  notification,
  fingerprint,
  adminUserId,
  failureReason,
  idempotencyKey,
}: {
  notification: ReturnType<typeof canonicalNotification>;
  fingerprint: string;
  adminUserId: string;
  failureReason: string;
  idempotencyKey: string;
}) {
  if (
    !SUPABASE_URL ||
    notification.studentId === null ||
    notification.studentId === undefined
  ) {
    return false;
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) return false;

  const now = new Date().toISOString();
  const payload = {
    student_id: notification.studentId,
    student_type: notification.studentType,
    channel: "email",
    direction: "outbound",
    subject: notification.subject,
    message: notification.message,
    status: "failed",
    source: "student_notification_system",
    failed_at: now,
    related_type: notification.relatedType || null,
    related_id:
      notification.relatedId === null || notification.relatedId === undefined
        ? null
        : String(notification.relatedId),
    failure_reason: failureReason.slice(0, 1000),
    metadata: {
      event_type: notification.eventType,
      event_label: notification.eventLabel,
      trigger: notification.trigger,
      risk: notification.risk,
      notification_fingerprint: fingerprint,
      sent_by_admin_user_id: adminUserId,
      delivery_engine: "resend",
      safety_preview_verified: true,
      resend_idempotency_key: idempotencyKey,
      delivery_failed: true,
    },
  };

  try {
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
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      console.warn(
        "Failed-notification audit logging skipped:",
        response.status
      );
      return false;
    }

    return true;
  } catch (auditError) {
    console.warn("Failed-notification audit logging crashed:", auditError);
    return false;
  }
}

async function sendEmail(
  notification: ReturnType<typeof canonicalNotification>,
  idempotencyKey: string
) {
  if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY.");

  const highRisk = notification.risk === "high";
  const accent = highRisk ? "#b42318" : "#ff5a0a";
  const accentSoft = highRisk ? "#fff1f0" : "#fff4e8";
  const accentBorder = highRisk ? "#fda29b" : "#fdba74";

  const preheader = `${notification.eventLabel}. ${notification.trigger}`.slice(
    0,
    140
  );

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
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }

    @media only screen and (max-width: 620px) {
      .outer { padding: 10px 6px !important; }
      .card { width: 100% !important; border-radius: 20px !important; }
      .header { padding: 28px 18px 20px !important; }
      .section { padding-left: 14px !important; padding-right: 14px !important; }
      .footer { padding: 18px !important; }
      .title { font-size: 25px !important; line-height: 1.2 !important; }
      .copy { font-size: 14px !important; line-height: 1.75 !important; }
      .button { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .action-cell { display: block !important; width: 100% !important; padding: 0 0 8px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5eee5;font-family:Arial,Helvetica,sans-serif;color:#10233f;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5eee5;">
    <tr>
      <td align="center" class="outer" style="padding:30px 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          class="card"
          style="max-width:700px;background:#fffdf9;border:1px solid #efc79e;border-radius:30px;overflow:hidden;box-shadow:0 20px 54px rgba(16,35,63,0.10);">

          <tr>
            <td style="height:7px;background:${accent};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <tr>
            <td class="header" style="padding:36px 30px 24px;text-align:center;">
              <div style="display:inline-block;padding:7px 11px;border-radius:999px;background:${accentSoft};border:1px solid ${accentBorder};color:${accent};font-size:9px;font-weight:900;letter-spacing:1.7px;text-transform:uppercase;">
                Zaifan Consultancy · Student Update
              </div>

              <h1 class="title" style="margin:16px auto 0;max-width:580px;color:#10233f;font-size:30px;line-height:1.22;">
                ${escapeHtml(notification.eventLabel)}
              </h1>

              <p style="margin:12px auto 0;max-width:560px;color:#667085;font-size:14px;line-height:1.75;">
                Dear ${escapeHtml(notification.recipientName)},
              </p>
            </td>
          </tr>

          <tr>
            <td class="section" style="padding:0 30px 16px;">
              <div style="border:1px solid ${accentBorder};border-radius:20px;padding:20px;background:${accentSoft};">
                <div style="font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:${accent};">
                  Your update
                </div>
                <p class="copy" style="margin:10px 0 0;color:#344054;font-size:14px;line-height:1.85;font-weight:600;">
                  ${multiline(notification.message)}
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td class="section" style="padding:0 30px 16px;">
              <div style="border:1px solid #d5dce6;border-radius:18px;padding:17px;background:#ffffff;">
                <div style="font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#667085;">
                  What changed
                </div>
                <div style="margin-top:8px;color:#10233f;font-size:13px;font-weight:900;line-height:1.6;">
                  ${escapeHtml(notification.trigger)}
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td class="section" style="padding:0 30px 24px;">
              <div style="border:1px solid #d5dce6;border-radius:18px;padding:17px;background:#f8fbff;">
                <div style="font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#123865;">
                  What to do next
                </div>
                <p style="margin:8px 0 0;color:#475467;font-size:13px;line-height:1.75;font-weight:600;">
                  Open your Student Portal for the latest case details and next action. Contact your Zaifan counselor if anything in this update is unclear or unexpected.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td class="section" style="padding:0 30px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="action-cell" style="width:50%;padding-right:5px;">
                    <a href="${STUDENT_PORTAL_URL}"
                      class="button"
                      style="display:block;background:#ff5a0a;color:#ffffff;text-decoration:none;text-align:center;padding:14px 14px;border-radius:14px;font-size:13px;font-weight:900;">
                      Open Student Portal
                    </a>
                  </td>
                  <td class="action-cell" style="width:50%;padding-left:5px;">
                    <a href="${WHATSAPP_URL}"
                      class="button"
                      style="display:block;border:1px solid #ccd5e1;background:#ffffff;color:#123865;text-decoration:none;text-align:center;padding:13px 14px;border-radius:14px;font-size:13px;font-weight:900;">
                      Contact Zaifan
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:14px 0 0;text-align:center;color:#98a2b3;font-size:10px;line-height:1.6;">
                This email reflects the latest student-facing status recorded by the Zaifan team. Admission, scholarship and visa decisions remain with the relevant institutions and authorities.
              </p>
            </td>
          </tr>

          <tr>
            <td class="footer" style="background:#123865;padding:19px 30px;color:#ffffff;">
              <div style="font-size:12px;font-weight:900;">Zaifan Consultancy</div>
              <div style="margin-top:4px;font-size:11px;line-height:1.55;color:#dbeafe;">
                Student Journey Update · zaifanconsultancy.com
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
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [notification.recipientEmail],
      subject: notification.subject,
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
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed." }, 405);
  }

  try {
    const user = await getAuthenticatedUser(req);

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      throw new Error("Invalid JSON request body.");
    }

    const mode = text(body.mode).toLowerCase();
    const notification = canonicalNotification(body.notification || {});

    validateNotification(notification);

    if (mode === "preview") {
      const { token, expiresAt } = await createPreviewToken(
        notification,
        user.id
      );

      return jsonResponse({
        success: true,
        previewToken: token,
        expiresAt,
      });
    }

    if (mode !== "send") {
      throw new Error("Unsupported notification mode.");
    }

    const previewToken = text(body.previewToken);
    if (!previewToken) {
      throw new Error("A valid preview token is required before sending.");
    }

    await verifyPreviewToken(previewToken, notification, user.id);

    if (notification.confirmationPhrase) {
      const confirmationText = text(body.confirmationText);
      if (confirmationText !== notification.confirmationPhrase) {
        throw new Error("Strong confirmation phrase did not match.");
      }
    }

    const fingerprint = await notificationFingerprint(notification);
    const duplicate = await findRecentDuplicate(notification, fingerprint);

    if (duplicate?.id) {
      return jsonResponse({
        success: true,
        messageId: duplicate?.metadata?.provider_message_id || null,
        communicationLogged: true,
        duplicateSuppressed: true,
        communicationWarning:
          "A matching notification was already sent moments ago, so the duplicate email was suppressed.",
      });
    }

    // Resend also protects this exact reviewed send at provider level.
    // Reopening a fresh preview creates a different key, so an Admin can still
    // deliberately resend later after reviewing the message again.
    const resendIdempotencyKey = `zaifan-student-${await sha256(previewToken)}`;

    let resend: any;

    try {
      resend = await sendEmail(notification, resendIdempotencyKey);
    } catch (sendError) {
      const failureReason =
        sendError instanceof Error
          ? sendError.message
          : "Student notification delivery failed.";

      await logFailedCommunication({
        notification,
        fingerprint,
        adminUserId: user.id,
        failureReason,
        idempotencyKey: resendIdempotencyKey,
      });

      throw sendError;
    }

    const messageId = resend?.id || null;

    const communication = await logCommunication({
      notification,
      fingerprint,
      messageId,
      adminUserId: user.id,
    });

    return jsonResponse({
      success: true,
      messageId,
      communicationLogged: communication.logged,
      duplicateSuppressed: false,
      communicationWarning: communication.warning,
    });
  } catch (error) {
    console.error("send-student-notification failed:", error);

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Student notification failed.",
      },
      400
    );
  }
});