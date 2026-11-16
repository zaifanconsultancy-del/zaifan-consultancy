// Staff-only: tells a student their booked call was confirmed, completed or
// cancelled. Called from the admin portal when the booking status changes.
// The booking is read from the database by id, so the email always matches
// what is saved (and can only go to the email on that booking).

import { createClient } from "npm:@supabase/supabase-js@2";
import { details, firstName, layout, paragraph, quote, sendEmail, SITE_URL, small, WHATSAPP_NUMBER } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function niceDate(value: unknown) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return text;
  return new Date(`${text.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

const COPY: Record<string, { kicker: string; title: (name: string) => string; text: string; subject: string }> = {
  confirmed: {
    kicker: "Call confirmed",
    title: (name) => `Your call is confirmed, ${name}`,
    text: "Your free consultation with Zaifan is confirmed. Your advisor will contact you at the time below on WhatsApp or a phone call.",
    subject: "Your Zaifan call is confirmed",
  },
  completed: {
    kicker: "Thanks for the call",
    title: (name) => `Great talking to you, ${name}`,
    text: "Thanks for your consultation. Your advisor will follow up with your plan and the next steps. Message us any time if you have questions.",
    subject: "Thanks for your call with Zaifan",
  },
  cancelled: {
    kicker: "Call cancelled",
    title: (name) => `Your call was cancelled, ${name}`,
    text: "Your booked call has been cancelled. If you still want to talk, book a new time or message us on WhatsApp. We're happy to help.",
    subject: "Your Zaifan call was cancelled",
  },
  pending: {
    kicker: "Booking update",
    title: (name) => `An update on your booking, ${name}`,
    text: "There is an update on your booked call. Your advisor will message you to agree a time.",
    subject: "An update on your Zaifan booking",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Use POST." });

  // Staff only.
  const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: who } = await caller.auth.getUser();
  const { data: isStaff } = who?.user ? await caller.rpc("is_zaifan_staff") : { data: false };
  if (isStaff !== true) return json(403, { success: false, error: "Only Zaifan staff can send this email." });

  try {
    const body = await req.json().catch(() => ({}));
    const appointmentId = Number(body.appointmentId);
    const note = String(body.note || "").trim().slice(0, 1000);
    if (!Number.isFinite(appointmentId)) return json(400, { success: false, error: "Which booking?" });

    // Read with the caller's own rights: a counselor can only email their own students.
    const { data: row } = await caller.from("appointments").select("*").eq("id", appointmentId).maybeSingle();
    if (!row) return json(404, { success: false, error: "This booking could not be found." });
    if (!row.email) return json(400, { success: false, error: "This booking has no email address." });

    const status = String(row.status || "pending").toLowerCase();
    const copy = COPY[status] || COPY.pending;
    const name = firstName(row.full_name);
    const when = [niceDate(row.appointment_date), row.appointment_time ? `${row.appointment_time} (Pakistan time)` : ""].filter(Boolean).join(" · ");

    const html = layout({
      preheader: `${copy.kicker}${when ? ` · ${when}` : ""}`,
      kicker: copy.kicker,
      title: copy.title(name),
      body:
        paragraph(copy.text) +
        details([
          ["When", status === "cancelled" ? "" : when],
          ["Type", row.consultation_type],
          ["Country", row.country_interest],
        ]) +
        (note ? paragraph("<strong>A note from your advisor</strong>") + quote(note) : "") +
        small("Questions or need a different time? Reply on WhatsApp."),
      button: status === "cancelled" ? { label: "Book a new time", url: `${SITE_URL}/appointment` } : { label: "Message us on WhatsApp", url: `https://wa.me/${WHATSAPP_NUMBER}` },
    });

    const sent = await sendEmail({ to: [String(row.email)], subject: copy.subject, html });
    return sent ? json(200, { success: true }) : json(502, { success: false, error: "The email could not be sent." });
  } catch (error) {
    console.error("send-appointment-status-email failed:", error);
    return json(500, { success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});
