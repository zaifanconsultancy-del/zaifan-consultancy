// Booking form → two emails: "new call booked" for the team and a booking
// confirmation (with an add-to-calendar button) for the student. Public, so
// it is guarded the same way as send-email: see claimSubmission() below.

import { createClient } from "npm:@supabase/supabase-js@2";
import { ADMIN_EMAIL, details, firstName, layout, paragraph, quote, sendEmail, SITE_URL, small, steps, WHATSAPP_NUMBER } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// --- Anti-spam gate (see send-email for the reasoning) ----------------------
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function claimSubmission(email: string): Promise<Record<string, unknown> | null> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const pattern = email.replace(/[\\%_]/g, (c) => `\\${c}`);
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await db.from("appointments").select("id", { count: "exact", head: true }).ilike("email", pattern).gte("confirmation_sent_at", dayAgo);
  if ((count ?? 0) >= 3) return null;
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: rows } = await db
    .from("appointments")
    .select("id")
    .ilike("email", pattern)
    .gte("created_at", since)
    .is("confirmation_sent_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  const id = rows?.[0]?.id;
  if (!id) return null;
  const { data: claimed } = await db
    .from("appointments")
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq("id", id)
    .is("confirmation_sent_at", null)
    .select("*")
    .maybeSingle();
  return claimed || null;
}
// ---------------------------------------------------------------------------

function niceDate(value: unknown) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return text;
  const date = new Date(`${text.slice(0, 10)}T12:00:00Z`);
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** "3:30 PM" / "15:30" → [15, 30] */
function parseTime(value: unknown): [number, number] | null {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = (match[3] || "").toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return [hours, minutes];
}

/** Google Calendar link for a 30-minute call in Pakistan time (UTC+5). */
function calendarLink(dateValue: unknown, timeValue: unknown, title: string) {
  const day = String(dateValue || "").slice(0, 10);
  const time = parseTime(timeValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !time) return "";
  const start = new Date(`${day}T00:00:00Z`);
  start.setUTCHours(time[0] - 5, time[1]);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${stamp(start)}/${stamp(end)}`, details: `Free consultation with Zaifan Consultancy. WhatsApp: https://wa.me/${WHATSAPP_NUMBER}` });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
    const country = String(row.country_interest || "").trim();
    const type = String(row.consultation_type || "Free consultation").trim();
    const when = [niceDate(row.appointment_date), row.appointment_time ? `${row.appointment_time} (Pakistan time)` : ""].filter(Boolean).join(" · ");
    const phoneDigits = String(row.phone || "").replace(/\D/g, "").replace(/^0/, "92");
    const calendar = calendarLink(row.appointment_date, row.appointment_time, "Zaifan Consultancy · free call");

    const adminHtml = layout({
      audience: "staff",
      preheader: `${name} booked ${when || "a call"}`,
      kicker: "New call booked",
      title: `${name} booked a call`,
      body:
        details([
          ["When", when || "No time picked"],
          ["Type", type],
          ["Country", country],
          ["Phone / WhatsApp", row.phone],
          ["Email", email],
        ]) +
        quote(row.message) +
        small("Confirm it in the admin portal (Leads → open the person → booking status) so they know it's on."),
      button: { label: "Open Leads", url: `${SITE_URL}/admin/leads` },
      secondary: phoneDigits.length >= 10 ? { label: "WhatsApp them", url: `https://wa.me/${phoneDigits}` } : undefined,
    });

    const studentHtml = layout({
      preheader: `Your Zaifan call: ${when}`,
      kicker: "Booking received",
      title: `You're booked in, ${firstName(name)}`,
      body:
        paragraph("Thanks for booking a free call with Zaifan. Here are your details:") +
        details([
          ["When", when || "We will message you to agree a time"],
          ["Type", type],
          ["Country", country],
        ]) +
        paragraph(`<strong>Before the call</strong>`) +
        steps([
          "We will confirm the time on WhatsApp.",
          "Keep your latest results (matric, FSc/A-levels or degree) and any English test score handy.",
          "Think about your budget per year. We will match universities to it.",
        ]) +
        small("Need to change the time? Just reply on WhatsApp, no need to book again."),
      button: calendar ? { label: "Add to Google Calendar", url: calendar } : { label: "Message us on WhatsApp", url: `https://wa.me/${WHATSAPP_NUMBER}` },
      secondary: calendar ? { label: "WhatsApp us", url: `https://wa.me/${WHATSAPP_NUMBER}` } : undefined,
    });

    const [adminOk, studentOk] = await Promise.all([
      sendEmail({ to: [ADMIN_EMAIL], subject: `Call booked: ${name} · ${when || "time not set"}`, html: adminHtml, replyTo: email || undefined }),
      email ? sendEmail({ to: [email], subject: `Your Zaifan call is booked${when ? ` · ${when}` : ""}`, html: studentHtml }) : Promise.resolve(true),
    ]);

    if (!adminOk || !studentOk) return json(502, { success: false, error: "One or more emails could not be sent." });
    return json(200, { success: true });
  } catch (error) {
    console.error("send-appointment-email failed:", error);
    return json(500, { success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});
