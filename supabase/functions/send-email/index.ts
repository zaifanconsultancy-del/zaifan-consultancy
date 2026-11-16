// Contact / home-page form → two emails: a heads-up for the Zaifan team and
// a "we got it" for the student. Public (the form is used before anyone
// logs in), so it is guarded: see claimSubmission() below.

import { createClient } from "npm:@supabase/supabase-js@2";
import { ADMIN_EMAIL, details, firstName, layout, paragraph, quote, sendEmail, SITE_URL, small, steps, WHATSAPP_NUMBER } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// --- Anti-spam gate ---------------------------------------------------------
// Only send for a submission that is really in the database: same email,
// saved in the last 15 minutes, not emailed yet, at most 3 confirmations per
// address a day. The email is built from the SAVED row, never from the caller.
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function claimSubmission(email: string): Promise<Record<string, unknown> | null> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const pattern = email.replace(/[\\%_]/g, (c) => `\\${c}`);
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await db.from("inquiries").select("id", { count: "exact", head: true }).ilike("email", pattern).gte("confirmation_sent_at", dayAgo);
  if ((count ?? 0) >= 3) return null;
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: rows } = await db
    .from("inquiries")
    .select("id")
    .ilike("email", pattern)
    .gte("created_at", since)
    .is("confirmation_sent_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const id = rows?.[0]?.id;
  if (!id) return null;
  const { data: claimed } = await db
    .from("inquiries")
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq("id", id)
    .is("confirmation_sent_at", null)
    .select("*")
    .maybeSingle();
  return claimed || null;
}
// ---------------------------------------------------------------------------

const clean = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text && !/^not sure/i.test(text) ? text : "";
};

function sourceLabel(value: unknown) {
  const text = String(value || "").replace(/^website_/, "").replace(/[_-]+/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Website";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Use POST." });

  try {
    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return json(400, { success: false, error: "Invalid JSON." });
    }

    const row = await claimSubmission(String(payload.email || "").trim().toLowerCase());
    if (!row) return json(200, { success: true, skipped: true });

    const name = String(row.full_name || "Student").trim();
    const email = String(row.email || "").trim().toLowerCase();
    const country = clean(row.country);
    const level = clean(row.study_level);
    const subject = clean(row.field_of_interest);
    const intake = clean(row.counseling_mode);
    const message = String(row.message || "").trim();
    const phoneDigits = String(row.phone || "").replace(/\D/g, "").replace(/^0/, "92");
    const destination = country || "studying abroad";

    // 1. For the team
    const adminHtml = layout({
      audience: "staff",
      preheader: `${name} · ${country || "country not chosen"} · ${row.phone || email}`,
      kicker: `New question · ${sourceLabel(row.lead_source)}`,
      title: `${name} wants help with ${destination}`,
      body:
        details([
          ["Name", name],
          ["Phone / WhatsApp", row.phone],
          ["Email", email],
          ["Country", country || "Not sure yet"],
          ["Study level", level],
          ["Subject", subject],
          ["When to start", intake],
          ["City", row.city],
        ]) +
        quote(message) +
        small("Reply within a few hours if you can. It is in the admin portal under Leads, with a reply clock."),
      button: { label: "Open Leads", url: `${SITE_URL}/admin/leads` },
      secondary: phoneDigits.length >= 10 ? { label: "WhatsApp them", url: `https://wa.me/${phoneDigits}` } : undefined,
    });

    // 2. For the student
    const studentHtml = layout({
      preheader: "Your question is with Zaifan. An advisor will reply soon.",
      kicker: "We got your message",
      title: `Thanks, ${firstName(name)}. Your question is with us.`,
      body:
        paragraph(`An advisor will read it and get back to you on WhatsApp, a call or email, usually within one working day.`) +
        details([
          ["Country", country || "Not decided yet (that's fine)"],
          ["Study level", level],
          ["Subject", subject],
          ["When to start", intake],
        ]) +
        quote(message) +
        paragraph(`<strong>What happens next</strong>`) +
        steps([
          "We look at your education, budget and goals.",
          "An advisor contacts you with honest options: countries, universities and real costs.",
          "If you want, we book a free call to make your plan together.",
        ]) +
        small(`No need to send the form again. Want to talk sooner? WhatsApp us any time.`),
      button: { label: "Message us on WhatsApp", url: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Assalam o Alaikum, I'm ${name}. I just sent a question on the website.`)}` },
      secondary: { label: "Book a free call", url: `${SITE_URL}/appointment` },
    });

    const [adminOk, studentOk] = await Promise.all([
      sendEmail({ to: [ADMIN_EMAIL], subject: `New question: ${name} · ${country || "country not chosen"}`, html: adminHtml, replyTo: email || undefined }),
      email ? sendEmail({ to: [email], subject: `${firstName(name)}, your question is with Zaifan`, html: studentHtml }) : Promise.resolve(true),
    ]);

    if (!adminOk || !studentOk) return json(502, { success: false, error: "One or more emails could not be sent." });
    return json(200, { success: true });
  } catch (error) {
    console.error("send-email failed:", error);
    return json(500, { success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});
