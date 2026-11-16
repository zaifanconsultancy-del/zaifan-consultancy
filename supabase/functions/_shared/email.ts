// One look for every Zaifan email: cream page, white card, navy header with
// the logo, orange button, navy footer. Plain tables + inline styles so it
// renders the same in Gmail, Outlook and phone mail apps.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

export const FROM_EMAIL = "Zaifan Consultancy <updates@notifications.zaifanconsultancy.com>";
export const ADMIN_EMAIL = "zaifanconsultancy@gmail.com";
export const SITE_URL = "https://www.zaifanconsultancy.com";
export const WHATSAPP_NUMBER = "923305718131";
export const WHATSAPP_DISPLAY = "0330 5718131";
const LOGO_URL = `${SITE_URL}/apple-touch-icon.png`;

const NAVY = "#071f50";
const ORANGE = "#ff4b12";
const CREAM = "#fff7ed";
const MUTED = "#5b6b85";

/** Escapes text for HTML. Every value that came from a person goes through this. */
export function esc(value: unknown, fallback = ""): string {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return (text || fallback)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Escaped text that keeps the person's line breaks. */
export function escLines(value: unknown, fallback = ""): string {
  return esc(value, fallback).replace(/\r?\n/g, "<br />");
}

export function firstName(name: unknown): string {
  return String(name || "").trim().split(/\s+/)[0] || "there";
}

/** A label/value list. Rows with an empty value are skipped. */
export function details(rows: Array<[string, unknown]>): string {
  const body = rows
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #f1e6da;color:${MUTED};font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;width:38%;vertical-align:top">${esc(label)}</td>
        <td style="padding:9px 0;border-bottom:1px solid #f1e6da;color:${NAVY};font-size:14px;font-weight:700;vertical-align:top">${esc(value)}</td>
      </tr>`
    )
    .join("");
  return body ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:4px 0 8px">${body}</table>` : "";
}

/** A big code or password in a cream box. */
export function codeBox(code: string, caption = ""): string {
  return `
  <div style="margin:18px 0;padding:18px;border-radius:16px;background:${CREAM};border:1px dashed #f3c9b3;text-align:center">
    <div style="font-family:'Courier New',monospace;font-size:30px;letter-spacing:8px;font-weight:700;color:${NAVY}">${esc(code)}</div>
    ${caption ? `<div style="margin-top:8px;color:${MUTED};font-size:12px">${esc(caption)}</div>` : ""}
  </div>`;
}

/** A quoted message (e.g. what the student wrote). */
export function quote(text: unknown): string {
  if (!String(text || "").trim()) return "";
  return `<div style="margin:14px 0;padding:14px 16px;border-left:4px solid ${ORANGE};background:${CREAM};border-radius:0 12px 12px 0;color:${NAVY};font-size:14px;line-height:1.6">${escLines(text)}</div>`;
}

/** A short numbered "what happens next" list. */
export function steps(items: string[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px">${items
    .map(
      (item, index) => `
    <tr>
      <td style="width:34px;padding:6px 0;vertical-align:top">
        <div style="width:24px;height:24px;border-radius:12px;background:${NAVY};color:#fff;font-size:12px;font-weight:700;line-height:24px;text-align:center">${index + 1}</div>
      </td>
      <td style="padding:8px 0;color:${NAVY};font-size:14px;line-height:1.5">${esc(item)}</td>
    </tr>`
    )
    .join("")}</table>`;
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 14px;color:${NAVY};font-size:15px;line-height:1.65">${html}</p>`;
}

export function small(html: string): string {
  return `<p style="margin:14px 0 0;color:${MUTED};font-size:12px;line-height:1.6">${html}</p>`;
}

type LayoutOptions = {
  preheader?: string; // grey preview line in the inbox
  kicker: string; // small orange line above the title
  title: string;
  body: string; // already-safe HTML built with the helpers above
  button?: { label: string; url: string };
  secondary?: { label: string; url: string };
  audience?: "student" | "staff";
};

export function layout({ preheader = "", kicker, title, body, button, secondary, audience = "student" }: LayoutOptions): string {
  const buttonHtml = button
    ? `<a href="${esc(button.url)}" style="display:inline-block;background:${ORANGE};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border-radius:14px">${esc(button.label)}</a>`
    : "";
  const secondaryHtml = secondary
    ? `<a href="${esc(secondary.url)}" style="display:inline-block;margin-left:8px;border:1px solid #e4d8cb;color:${NAVY};text-decoration:none;font-weight:700;font-size:14px;padding:13px 20px;border-radius:14px">${esc(secondary.label)}</a>`
    : "";
  const footerLine =
    audience === "staff"
      ? "This is an internal Zaifan Consultancy notification."
      : `Questions? WhatsApp us on ${WHATSAPP_DISPLAY} or reply to your counselor. Admission, scholarship and visa decisions are made by the universities and embassies.`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM}">
  <tr><td align="center" style="padding:28px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #f0e2d3">
      <tr><td style="background:${NAVY};padding:22px 28px">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle"><img src="${LOGO_URL}" width="40" height="40" alt="Zaifan" style="display:block;border-radius:20px;background:#fff" /></td>
          <td style="vertical-align:middle;padding-left:12px">
            <div style="color:#ffffff;font-size:17px;font-weight:700;letter-spacing:2px">ZAIFAN</div>
            <div style="color:#ff8a5c;font-size:9px;font-weight:700;letter-spacing:3px">CONSULTANCY</div>
          </td>
        </tr></table>
        <div style="margin-top:22px;color:#ff8a5c;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase">${esc(kicker)}</div>
        <div style="margin-top:6px;color:#ffffff;font-size:24px;line-height:1.25;font-weight:700">${esc(title)}</div>
      </td></tr>
      <tr><td style="padding:26px 28px 8px">
        ${body}
      </td></tr>
      ${buttonHtml || secondaryHtml ? `<tr><td style="padding:8px 28px 26px">${buttonHtml}${secondaryHtml}</td></tr>` : ""}
      <tr><td style="background:${NAVY};padding:18px 28px">
        <div style="color:#ffffff;font-size:13px;font-weight:700">Zaifan Consultancy · Study abroad from Pakistan</div>
        <div style="margin-top:6px;color:#b9c3d6;font-size:11px;line-height:1.6">${esc(footerLine)}</div>
        <div style="margin-top:8px;font-size:11px"><a href="${SITE_URL}" style="color:#ff8a5c;text-decoration:none">zaifanconsultancy.com</a> &nbsp;·&nbsp; <a href="https://wa.me/${WHATSAPP_NUMBER}" style="color:#ff8a5c;text-decoration:none">WhatsApp</a></div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Sends through Resend. Returns true when Resend accepted it. */
export async function sendEmail({ to, subject, html, replyTo }: { to: string[]; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is missing");
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!response.ok) console.error("Resend failed", response.status, await response.text());
  return response.ok;
}
