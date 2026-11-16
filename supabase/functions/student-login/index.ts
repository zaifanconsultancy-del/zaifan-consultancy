// Creates / resets / switches off a student's portal login.
// Only a Zaifan admin may call it. The student's password is generated here,
// set on a real Supabase Auth account, and returned ONCE to the admin screen
// (which emails it). It is never stored anywhere readable.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function makePassword(length = 12) {
  // No look-alike characters (0/O, 1/l/I) so it can be read out on the phone.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

const NEVER = "876000h"; // ~100 years

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { success: false, message: "Use POST." });

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return reply(401, { success: false, message: "Please sign in again." });
  }

  // Who is calling? Must be a Zaifan admin.
  const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: who } = await caller.auth.getUser();
  if (!who?.user) return reply(401, { success: false, message: "Please sign in again." });
  const { data: isAdmin, error: adminError } = await caller.rpc("is_zaifan_admin");
  if (adminError || isAdmin !== true) {
    return reply(403, { success: false, message: "Only a Zaifan admin can manage student logins." });
  }

  let body: { action?: string; personId?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return reply(400, { success: false, message: "Bad request." });
  }

  const action = String(body.action || "");
  const personId = String(body.personId || "");
  const email = String(body.email || "").trim().toLowerCase();
  if (!["create", "reset", "disable", "enable"].includes(action) || !/^[0-9a-f-]{36}$/i.test(personId)) {
    return reply(400, { success: false, message: "Bad request." });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: person, error: personError } = await admin
    .from("student_identities")
    .select("id, full_name, auth_user_id, portal_email")
    .eq("id", personId)
    .maybeSingle();
  if (personError || !person) return reply(404, { success: false, message: "This student could not be found." });

  const savePerson = async (patch: Record<string, unknown>) => {
    const { error } = await admin.from("student_identities").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", personId);
    if (error) throw new Error(error.message);
  };

  try {
    if (action === "create" || (action === "reset" && !person.auth_user_id)) {
      if (person.auth_user_id) return reply(409, { success: false, message: "This student already has a login. Send a new password instead." });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { success: false, message: "Please type a valid email address." });

      const temporaryPassword = makePassword();
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { full_name: person.full_name, must_change_password: true },
        app_metadata: { role: "student" },
      });
      if (error || !created?.user) {
        const taken = /already|registered|exists/i.test(error?.message || "");
        return reply(taken ? 409 : 500, {
          success: false,
          message: taken
            ? "This email already has a Zaifan login (a staff member or another student). Use a different email."
            : error?.message || "The login could not be created.",
        });
      }
      try {
        await savePerson({ auth_user_id: created.user.id, portal_email: email, portal_active: true, portal_created_at: new Date().toISOString() });
      } catch (linkError) {
        await admin.auth.admin.deleteUser(created.user.id); // don't leave a login that opens nothing
        throw linkError;
      }
      return reply(200, { success: true, action: "create", email, temporaryPassword });
    }

    if (action === "reset") {
      const temporaryPassword = makePassword();
      const { data: current } = await admin.auth.admin.getUserById(person.auth_user_id);
      const patch: Record<string, unknown> = {
        password: temporaryPassword,
        user_metadata: { ...(current?.user?.user_metadata || {}), must_change_password: true },
      };
      const newEmail = email && email !== (current?.user?.email || "").toLowerCase() ? email : "";
      if (newEmail) {
        patch.email = newEmail;
        patch.email_confirm = true;
      }
      const { error } = await admin.auth.admin.updateUserById(person.auth_user_id, patch);
      if (error) {
        const taken = /already|registered|exists/i.test(error.message || "");
        return reply(taken ? 409 : 500, { success: false, message: taken ? "That email is already used by another login." : error.message });
      }
      const finalEmail = newEmail || current?.user?.email || person.portal_email || "";
      await savePerson({ portal_email: finalEmail });
      return reply(200, { success: true, action: "reset", email: finalEmail, temporaryPassword });
    }

    // disable / enable
    if (!person.auth_user_id) return reply(400, { success: false, message: "This student has no login yet." });
    const off = action === "disable";
    const { error } = await admin.auth.admin.updateUserById(person.auth_user_id, { ban_duration: off ? NEVER : "none" });
    if (error) return reply(500, { success: false, message: error.message });
    await savePerson({ portal_active: !off });
    return reply(200, { success: true, action, active: !off });
  } catch (error) {
    return reply(500, { success: false, message: (error as Error)?.message || "Something went wrong." });
  }
});
