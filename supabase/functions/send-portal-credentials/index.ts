import { codeBox, details, firstName, layout, paragraph, small, steps } from "../_shared/email.ts";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const FROM_EMAIL =
  "Zaifan Consultancy <updates@notifications.zaifanconsultancy.com>";
const WEBSITE_URL = "https://www.zaifanconsultancy.com";
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

  const isNew = payload.action === "create";
  const html = layout({
    preheader: isNew ? "Your Zaifan student portal is ready." : "Your new Zaifan portal password.",
    kicker: "Student portal",
    title: isNew ? `Your student portal is ready, ${firstName(payload.studentName)}` : `Your new portal password, ${firstName(payload.studentName)}`,
    body:
      paragraph(
        isNew
          ? "Your Zaifan student portal is where you follow your journey: your to-do list, documents, university applications, visa steps and payments, all in one place."
          : "The Zaifan team has set a new password for your student portal."
      ) +
      details([["Login email", payload.recipientEmail]]) +
      codeBox(payload.temporaryPassword, "Temporary password · you choose your own after signing in") +
      (isNew
        ? paragraph("<strong>In your portal you can</strong>") +
          steps(["See exactly what you need to do next.", "Upload your documents from your phone.", "Send payment receipts and ask your counselor questions."])
        : "") +
      small("Forgot it later? Use “Forgot your password?” on the portal login page to get a code by email."),
    button: { label: "Open my portal", url: STUDENT_PORTAL_URL },
    secondary: { label: "WhatsApp us", url: WHATSAPP_URL },
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [payload.recipientEmail],
      subject: payload.action === "create" ? "Your Zaifan student portal is ready" : "Your new Zaifan portal password",
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
