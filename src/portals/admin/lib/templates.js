// Ready-made messages for WhatsApp / email. Each one fills itself in from the
// student's file ({first}, {country}, {university}, {due}…), and the worker can
// still edit the text before sending. Plain, friendly English.

import { firstName, fmtDate, fmtMoneyList } from "./format";

const PORTAL = "https://www.zaifanconsultancy.com/student";
const BOOK = "https://www.zaifanconsultancy.com/appointment";

export const TEMPLATES = [
  {
    id: "first-reply",
    label: "First reply to a new lead",
    when: ["lead"],
    subject: "Your question to Zaifan Consultancy",
    text: `Assalam o Alaikum {first}, this is {me} from Zaifan Consultancy. Thank you for your message{countryAbout}.

To guide you properly, could you share:
1. Your last degree and marks/CGPA
2. Any English test (IELTS/PTE/Duolingo) or plan to take one
3. Your budget per year

Or if easier, book a free call here: ${BOOK}`,
  },
  {
    id: "follow-up",
    label: "Follow up (no reply yet)",
    when: ["lead", "consulting"],
    subject: "Following up from Zaifan",
    text: `Assalam o Alaikum {first}, just following up on your study plan{countryFor}. Are you still interested? Intakes fill up early, so it's best to start soon. Reply here any time and I'll guide you step by step.`,
  },
  {
    id: "after-call",
    label: "After the consultation call",
    when: ["consulting"],
    subject: "Your study plan from Zaifan",
    text: `Thank you for your time today {first}! As discussed{countryFor}, the next step is to collect your documents so we can start your applications.

I will send you the exact list. Whenever you're ready to go ahead, just reply "yes" and we will start.`,
  },
  {
    id: "documents",
    label: "Ask for documents",
    when: ["applying", "offer", "visa"],
    subject: "Documents needed for your file",
    text: `Assalam o Alaikum {first}, to move your file forward we still need:
{missing}

You can upload them in your student portal (${PORTAL}) or send clear scans here on WhatsApp. Thank you!`,
  },
  {
    id: "payment",
    label: "Payment reminder",
    when: ["applying", "offer", "visa"],
    needs: "due",
    subject: "Payment reminder from Zaifan",
    text: `Assalam o Alaikum {first}, a gentle reminder that {due} is still due on your Zaifan file. After paying, please upload the receipt in your student portal (${PORTAL}) or send it here so we can confirm it. Thank you!`,
  },
  {
    id: "applied",
    label: "Application submitted",
    when: ["applying"],
    subject: "Your application has been submitted",
    text: `Good news {first}! Your application to {university} has been submitted. Universities usually take a few weeks to reply. We'll update you as soon as we hear anything, and you can follow it in your student portal: ${PORTAL}`,
  },
  {
    id: "offer",
    label: "Congratulations on the offer",
    when: ["offer"],
    subject: "Congratulations on your offer!",
    text: `Congratulations {first}! 🎉 {university} has offered you a place. Next we'll prepare your visa file. I'll share the visa document list shortly. Very proud of you!`,
  },
  {
    id: "visa-appointment",
    label: "Visa appointment reminder",
    when: ["visa"],
    subject: "Your visa appointment",
    text: `Assalam o Alaikum {first}, reminder that your visa appointment is on {visaDate}. Please bring your original passport, all documents in the file we prepared, and arrive 30 minutes early. Message me if anything is unclear. Best of luck!`,
  },
  {
    id: "portal",
    label: "How to use the student portal",
    when: ["applying", "offer", "visa"],
    subject: "Your Zaifan student portal",
    text: `Assalam o Alaikum {first}, you can follow your whole file in your student portal: ${PORTAL}

There you can see your to-do list, upload documents, send payment receipts and ask questions. If you forgot your password, use "Forgot your password?" on the login page.`,
  },
];

/** Values a template can use, worked out from the person's file. */
export function templateValues(person, me) {
  const app = person.applications.find((item) => /offer|accepted/i.test(String(item.offer_status || ""))) || person.applications[0];
  const visa = person.visas.find((item) => item.appointment_date) || person.visas[0];
  const waiting = person.documents.filter((doc) => !["verified", "approved"].includes(String(doc.status || "").toLowerCase()));
  const missing = waiting.length
    ? waiting.map((doc) => `• ${doc.document_name || doc.document_type || "Document"}${String(doc.status).toLowerCase() === "rejected" ? " (please send a clearer copy)" : ""}`).join("\n")
    : "• (write the documents here)";
  return {
    first: firstName(person.name),
    me: firstName(me?.name || "the Zaifan team"),
    country: person.country || "",
    countryAbout: person.country ? ` about studying in ${person.country}` : "",
    countryFor: person.country ? ` for ${person.country}` : "",
    university: app?.university || "the university",
    due: person.money?.due?.length ? fmtMoneyList(person.money.due) : "",
    visaDate: visa?.appointment_date ? `${fmtDate(visa.appointment_date)}${visa.appointment_time ? ` at ${String(visa.appointment_time).slice(0, 5)}` : ""}` : "(date)",
    missing,
  };
}

export function fillTemplate(text, values) {
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
}

/** Templates that make sense for this person first, the rest after. */
export function templatesFor(person) {
  const fits = (template) => Boolean(template.when.includes(person.stage) && (!template.needs || (template.needs === "due" && person.money?.due?.length)));
  return [...TEMPLATES.filter(fits), ...TEMPLATES.filter((template) => !fits(template))].map((template) => ({ ...template, suggested: fits(template) }));
}
