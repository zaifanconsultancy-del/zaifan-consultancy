// "Forgot password" for the student portal. Public: the student is not
// logged in. We email a one-time code (from Supabase Auth's recovery flow)
// with our own Zaifan design. The old password keeps working until the
// student actually types the code and picks a new password, so a stranger
// pressing "forgot password" for someone else cannot lock them out.
//
// Always answers { success: true } so nobody can test which emails exist.
// Limits: one code per 2 minutes, five per day, per student.

import { createClient } from "npm:@supabase/supabase-js@2";
import { codeBox, esc, firstName, layout, paragraph, sendEmail, small, SITE_URL } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ok = () => new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return ok();

  let email = "";
  try {
    email = String((await req.json())?.email || "").trim().toLowerCase();
  } catch {
    return ok();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return ok();

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const { data: person } = await admin
      .from("student_identities")
      .select("id, full_name, auth_user_id, portal_active")
      .ilike("portal_email", email.replace(/[\\%_]/g, (c) => `\\${c}`))
      .not("auth_user_id", "is", null)
      .maybeSingle();
    if (!person?.auth_user_id || person.portal_active === false) return ok();

    // Throttle, remembered on the login itself (no extra table needed).
    const { data: account } = await admin.auth.admin.getUserById(person.auth_user_id);
    const meta = (account?.user?.app_metadata || {}) as Record<string, unknown>;
    const now = Date.now();
    const recent = (Array.isArray(meta.reset_codes_sent) ? (meta.reset_codes_sent as number[]) : []).filter((t) => now - t < 24 * 3600 * 1000);
    if (recent.some((t) => now - t < 2 * 60 * 1000) || recent.length >= 5) return ok();

    const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email: account?.user?.email || email });
    const code = link?.properties?.email_otp;
    if (error || !code) {
      console.error("generateLink failed", error?.message);
      return ok();
    }
    await admin.auth.admin.updateUserById(person.auth_user_id, { app_metadata: { ...meta, reset_codes_sent: [...recent, now] } });

    const html = layout({
      preheader: `Your Zaifan portal code is ${code}`,
      kicker: "Student portal",
      title: "Your password reset code",
      body:
        paragraph(`Hi ${esc(firstName(person.full_name))}, someone (hopefully you) asked to reset the password for your Zaifan student portal.`) +
        paragraph("Type this code on the portal page, then choose a new password:") +
        codeBox(code, "The code works for 1 hour and only once.") +
        small("Didn't ask for this? Ignore this email. Your current password keeps working and nothing changes."),
      button: { label: "Open the student portal", url: `${SITE_URL}/student` },
    });
    await sendEmail({ to: [account?.user?.email || email], subject: `Your Zaifan portal code: ${code}`, html });
  } catch (error) {
    console.error("forgot password failed", (error as Error)?.message);
  }
  return ok();
});
