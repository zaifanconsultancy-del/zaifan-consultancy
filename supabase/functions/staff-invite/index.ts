// Adds a counselor to the team, or resets / switches off a counselor's login.
// Only a Zaifan admin may call it. The temporary password is generated here,
// set on a real Supabase Auth account, emailed straight to the counselor and
// returned ONCE to the admin screen (in case the email fails). The counselor
// must choose their own password on first login.

import { createClient } from "npm:@supabase/supabase-js@2";
import { codeBox, details, firstName, layout, paragraph, sendEmail, SITE_URL, small } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const COUNSELOR_PORTAL_URL = `${SITE_URL}/counselor`;
const NEVER = "876000h"; // ~100 years

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function makePassword(length = 12) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function sendLoginEmail(to: string, name: string, password: string, isNew: boolean) {
  const html = layout({
    audience: "staff",
    preheader: isNew ? "You've been added to the Zaifan team." : "Your new Zaifan counselor password.",
    kicker: "Zaifan team",
    title: isNew ? `Welcome to the team, ${firstName(name)}` : `Your new password, ${firstName(name)}`,
    body:
      paragraph(
        isNew
          ? "An admin has added you as a counselor. In the counselor portal you see the students assigned to you, your tasks for today, and everything about each student's file."
          : "An admin has reset your counselor portal password."
      ) +
      details([["Login email", to]]) +
      codeBox(password, "Temporary password · you choose your own when you first log in") +
      small("If you did not expect this email, tell the Zaifan office."),
    button: { label: "Open the counselor portal", url: COUNSELOR_PORTAL_URL },
  });
  return sendEmail({ to: [to], subject: isNew ? "Your Zaifan counselor login" : "Your new Zaifan counselor password", html });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { success: false, message: "Use POST." });

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return reply(401, { success: false, message: "Please sign in again." });

  const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: who } = await caller.auth.getUser();
  if (!who?.user) return reply(401, { success: false, message: "Please sign in again." });
  const { data: isAdmin, error: adminError } = await caller.rpc("is_zaifan_admin");
  if (adminError || isAdmin !== true) return reply(403, { success: false, message: "Only a Zaifan admin can manage the team." });

  let body: { action?: string; email?: string; fullName?: string; profileId?: string };
  try {
    body = await req.json();
  } catch {
    return reply(400, { success: false, message: "Bad request." });
  }
  const action = String(body.action || "");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    if (action === "invite") {
      const email = String(body.email || "").trim().toLowerCase();
      const fullName = String(body.fullName || "").trim();
      if (!fullName) return reply(400, { success: false, message: "Please type the counselor's name." });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { success: false, message: "Please type a valid email address." });

      const { data: existing } = await admin.from("counselor_profiles").select("id").ilike("email", email).maybeSingle();
      if (existing) return reply(409, { success: false, message: "A counselor with this email is already on the team." });

      const temporaryPassword = makePassword();
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, must_change_password: true },
        app_metadata: { role: "counselor" },
      });
      if (error || !created?.user) {
        const taken = /already|registered|exists/i.test(error?.message || "");
        return reply(taken ? 409 : 500, {
          success: false,
          message: taken ? "This email already has a Zaifan login (a student or staff member). Use a different email." : error?.message || "The login could not be created.",
        });
      }
      const userId = created.user.id;
      const { error: profileError } = await admin.from("counselor_profiles").insert({
        id: userId,
        user_id: userId,
        auth_id: userId,
        full_name: fullName,
        email,
        role: "counselor",
        status: "active",
        is_active: true,
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(userId); // don't leave a login that opens nothing
        return reply(500, { success: false, message: profileError.message });
      }
      const emailed = await sendLoginEmail(email, fullName, temporaryPassword, true);
      return reply(200, { success: true, action, email, emailed, temporaryPassword: emailed ? null : temporaryPassword });
    }

    // reset / disable / enable an existing counselor
    const profileId = String(body.profileId || "");
    if (!["reset", "disable", "enable"].includes(action) || !/^[0-9a-f-]{36}$/i.test(profileId)) return reply(400, { success: false, message: "Bad request." });
    const { data: profile } = await admin.from("counselor_profiles").select("id, user_id, auth_id, full_name, email").eq("id", profileId).maybeSingle();
    if (!profile) return reply(404, { success: false, message: "This counselor could not be found." });
    const userId = profile.auth_id || profile.user_id;
    if (!userId) return reply(400, { success: false, message: "This counselor has no login yet." });
    if (userId === who.user.id) return reply(400, { success: false, message: "You can't change your own login here." });

    if (action === "reset") {
      const temporaryPassword = makePassword();
      const { data: current } = await admin.auth.admin.getUserById(userId);
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password: temporaryPassword,
        user_metadata: { ...(current?.user?.user_metadata || {}), must_change_password: true },
      });
      if (error) return reply(500, { success: false, message: error.message });
      const to = current?.user?.email || profile.email;
      const emailed = to ? await sendLoginEmail(to, profile.full_name || "", temporaryPassword, false) : false;
      return reply(200, { success: true, action, email: to, emailed, temporaryPassword: emailed ? null : temporaryPassword });
    }

    const off = action === "disable";
    const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: off ? NEVER : "none" });
    if (error) return reply(500, { success: false, message: error.message });
    await admin.from("counselor_profiles").update({ is_active: !off, status: off ? "inactive" : "active", updated_at: new Date().toISOString() }).eq("id", profileId);
    return reply(200, { success: true, action, active: !off });
  } catch (error) {
    return reply(500, { success: false, message: (error as Error)?.message || "Something went wrong." });
  }
});
