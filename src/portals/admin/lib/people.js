// Turns the raw tables into ONE record per person.
//
// The database has no "students" table. A person shows up as a row in
// `student_identities`, and every inquiry / appointment they ever sent points
// at that row through `person_id`. Everything else (applications, documents,
// payments…) points at a specific inquiry or appointment through
// (student_type, student_id). This file stitches all of that together so the
// pages can just say `person.applications`.

import { daysUntil, sourceLabel, sumByCurrency, toDate } from "./format";

export const STAGES = [
  {
    id: "lead",
    label: "New lead",
    short: "New",
    color: "#64748b",
    hint: "Sent a question or booked a call. Nobody has spoken to them yet.",
  },
  {
    id: "consulting",
    label: "In conversation",
    short: "Talking",
    color: "#0ea5e9",
    hint: "We have spoken. Deciding on country, course and budget.",
  },
  {
    id: "applying",
    label: "Applying",
    short: "Applying",
    color: "#f59e0b",
    hint: "Collecting documents and sending university applications.",
  },
  {
    id: "offer",
    label: "Offer received",
    short: "Offer",
    color: "#8b5cf6",
    hint: "At least one university has said yes.",
  },
  {
    id: "visa",
    label: "Visa",
    short: "Visa",
    color: "#ff4b12",
    hint: "Visa file, appointment and decision.",
  },
  {
    id: "departed",
    label: "Flown",
    short: "Flown",
    color: "#10b981",
    hint: "Visa granted and the student has travelled.",
  },
  {
    id: "closed",
    label: "Closed",
    short: "Closed",
    color: "#94a3b8",
    hint: "Not continuing with Zaifan for now.",
  },
];

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((stage) => [stage.id, stage]));
export const LEAD_STAGES = ["lead", "consulting"];
export const STUDENT_STAGES = ["applying", "offer", "visa", "departed"];
export const JOURNEY_STAGES = STAGES.filter((stage) => stage.id !== "closed");

export function stageIndex(stageId) {
  return JOURNEY_STAGES.findIndex((stage) => stage.id === stageId);
}

/** Why a file was closed. Saved with the history line, counted on Reports. */
export const CLOSE_REASONS = [
  { id: "no_reply", label: "Stopped replying" },
  { id: "too_expensive", label: "Too expensive for them" },
  { id: "other_consultant", label: "Went with another consultant" },
  { id: "changed_mind", label: "Changed their mind / postponed" },
  { id: "not_eligible", label: "Not eligible (marks, age, gap, English)" },
  { id: "visa_refused", label: "Visa refused" },
  { id: "duplicate", label: "Duplicate or test entry" },
  { id: "other", label: "Something else" },
];
export const CLOSE_REASON_LABEL = Object.fromEntries(CLOSE_REASONS.map((reason) => [reason.id, reason.label]));

export const PRIORITIES = [
  { id: "low", label: "Low", color: "#94a3b8" },
  { id: "normal", label: "Normal", color: "#0ea5e9" },
  { id: "high", label: "High", color: "#f59e0b" },
  { id: "urgent", label: "Urgent", color: "#ef4444" },
];

const OFFER_STATUSES = new Set([
  "offer_received",
  "offer_accepted",
  "conditional_offer",
  "unconditional_offer",
  "accepted",
]);

function sourceKey(type, id) {
  return `${String(type || "").toLowerCase()}:${String(id)}`;
}

function latest(list, getter) {
  let best = null;
  let bestTime = -Infinity;
  for (const item of list) {
    const time = toDate(getter(item))?.getTime() ?? -Infinity;
    if (time > bestTime) {
      bestTime = time;
      best = item;
    }
  }
  return best;
}

function newPerson(id) {
  return {
    id,
    identity: null,
    name: "",
    email: "",
    phone: "",
    country: "",
    stage: "lead",
    stageIsManual: false,
    priority: "normal",
    assignedTo: null,
    adminNotes: "",
    createdAt: null,
    lastActivityAt: null,
    sources: [],
    primary: null,
    applications: [],
    documents: [],
    requirements: [],
    visas: [],
    invoices: [],
    payments: [],
    receipts: [],
    communications: [],
    tasks: [],
    notes: [],
    timeline: [],
    reminders: [],
    supportRequests: [],
    portalAccount: null,
    universities: [],
    counts: {},
  };
}

function deriveStage(person) {
  if (person.visas.length) return "visa";
  if (person.applications.some((app) => OFFER_STATUSES.has(String(app.offer_status || "").toLowerCase()))) {
    return "offer";
  }
  if (person.applications.length || person.documents.length || person.portalAccount) return "applying";
  const spoken = person.sources.some((source) => {
    const status = String(source.row.status || "").toLowerCase();
    if (source.type === "appointment") return ["confirmed", "completed"].includes(status);
    return ["contacted", "in_progress", "qualified"].includes(status);
  });
  return spoken ? "consulting" : "lead";
}

export function buildPeople(data) {
  const identities = new Map((data.identities || []).map((row) => [row.id, row]));
  const people = new Map();
  const bySource = new Map();

  const attachSource = (type, row) => {
    const id = row.person_id ? String(row.person_id) : `${type}-${row.id}`;
    let person = people.get(id);
    if (!person) {
      person = newPerson(id);
      person.identity = row.person_id ? identities.get(row.person_id) || null : null;
      people.set(id, person);
    }
    const source = {
      type,
      id: row.id,
      key: sourceKey(type, row.id),
      row,
      createdAt: row.created_at,
      label:
        type === "appointment"
          ? `Booked a call${row.consultation_type ? ` · ${row.consultation_type}` : ""}`
          : sourceLabel(row.lead_source),
    };
    person.sources.push(source);
    bySource.set(source.key, person);
  };

  for (const row of data.inquiries || []) attachSource("inquiry", row);
  for (const row of data.appointments || []) attachSource("appointment", row);

  const attach = (listKey, rows, { sort = "created_at" } = {}) => {
    for (const row of rows || []) {
      const person = bySource.get(sourceKey(row.student_type, row.student_id));
      if (!person) continue;
      person[listKey].push(row);
    }
    for (const person of people.values()) {
      person[listKey].sort(
        (a, b) => (toDate(b[sort])?.getTime() || 0) - (toDate(a[sort])?.getTime() || 0)
      );
    }
  };

  attach("applications", data.applications);
  attach("documents", (data.documents || []).filter((doc) => !doc.is_deleted));
  attach("visas", data.visas);
  attach("requirements", (data.requirements || []).filter((row) => !row.admin_only), { sort: "created_at" });
  attach("invoices", data.invoices);
  attach("payments", data.payments);
  attach("receipts", data.receipts);
  attach("communications", data.communications);
  attach("tasks", (data.tasks || []).filter((task) => !task.is_archived));
  attach("notes", data.notes);
  attach("timeline", data.timeline);
  attach("reminders", data.reminders);
  attach("supportRequests", data.supportRequests);
  attach("universities", (data.universities || []).filter((row) => !row.is_archived));

  for (const account of data.portalAccounts || []) {
    const person = bySource.get(sourceKey(account.student_type, account.student_id));
    if (person && !person.portalAccount) person.portalAccount = account;
  }

  for (const person of people.values()) {
    person.sources.sort(
      (a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)
    );
    const newest = person.sources[0];
    const oldest = person.sources[person.sources.length - 1];
    const identity = person.identity;

    person.name = identity?.full_name || newest?.row.full_name || "Unknown";
    person.email = identity?.primary_email || newest?.row.email || "";
    person.phone = identity?.primary_phone || newest?.row.phone || "";
    person.country =
      identity?.country ||
      person.applications[0]?.country ||
      person.sources.map((s) => s.row.country || s.row.country_interest).find((c) => c && !/not sure/i.test(c)) ||
      "";
    person.createdAt = oldest?.createdAt || identity?.created_at || null;
    person.priority = identity?.priority || "normal";
    person.assignedTo = identity?.assigned_to || null;
    person.adminNotes = identity?.admin_notes || "";

    // Child tables key on ONE inquiry/appointment. Prefer the source that
    // already has data hanging off it, otherwise the newest one.
    const withData = person.sources.find((source) =>
      [
        ...person.applications,
        ...person.documents,
        ...person.invoices,
        ...person.payments,
        ...person.tasks,
      ].some((row) => sourceKey(row.student_type, row.student_id) === source.key)
    );
    const primarySource = withData || newest;
    person.primary = primarySource
      ? { student_type: primarySource.type, student_id: primarySource.id }
      : null;

    const manualStage = identity?.stage_changed_at ? identity.stage : null;
    person.stage = manualStage && STAGE_BY_ID[manualStage] ? manualStage : deriveStage(person);
    person.stageIsManual = Boolean(manualStage);
    // Why and when the file was closed (from the newest "closed" history line).
    person.closed = null;
    if (person.stage === "closed") {
      const line = person.timeline.find((row) => row.metadata?.close_reason);
      person.closed = {
        reason: line?.metadata?.close_reason || "",
        note: line?.metadata?.close_note || "",
        at: line?.created_at || identity?.stage_changed_at || null,
        by: line?.created_by_name || "",
      };
    }

    const activityCandidates = [
      ...person.timeline.map((row) => row.created_at),
      ...person.communications.map((row) => row.created_at),
      ...person.notes.map((row) => row.created_at),
      ...person.sources.map((row) => row.createdAt),
      identity?.updated_at,
    ];
    person.lastActivityAt = latest(activityCandidates.map((value) => ({ value })), (item) => item.value)?.value || null;

    const openTasks = person.tasks.filter((task) => !isDone(task.status));
    const pendingDocs = person.documents.filter((doc) => !["verified", "approved"].includes(String(doc.status || "").toLowerCase()));
    // Money, kept per currency (an EUR invoice is never added to PKR ones).
    const liveInvoices = person.invoices.filter((invoice) => !["void", "cancelled", "draft"].includes(String(invoice.status || "").toLowerCase()));
    const openInvoices = liveInvoices.filter((invoice) => String(invoice.status || "").toLowerCase() !== "paid");
    // Some old invoices have outstanding_amount = 0 while nothing was paid,
    // so fall back to total − paid whenever the stored figure says 0.
    const invoiceDue = (invoice) => {
      const stored = Number(invoice.outstanding_amount || 0);
      return stored > 0 ? stored : Math.max(0, Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0));
    };
    const goodPayments = person.payments.filter((payment) => !["cancelled", "void", "refunded", "failed", "pending"].includes(String(payment.status || "").toLowerCase()));
    person.money = {
      invoiced: sumByCurrency(liveInvoices, (invoice) => invoice.total_amount, (invoice) => invoice.currency),
      paid: sumByCurrency(goodPayments, (payment) => payment.amount, (payment) => payment.currency),
      due: sumByCurrency(openInvoices, invoiceDue, (invoice) => invoice.currency),
    };
    const outstanding = person.money.due.reduce((sum, [, amount]) => sum + amount, 0);
    const overdueInvoices = openInvoices.filter((invoice) => invoiceDue(invoice) > 0 && invoice.due_date && daysUntil(invoice.due_date) < 0);
    const receiptsToReview = person.receipts.filter((receipt) => String(receipt.review_status || receipt.status || "").includes("pending"));
    const openSupport = person.supportRequests.filter((request) => !["resolved", "closed"].includes(String(request.status || "").toLowerCase()));

    person.counts = {
      openTasks: openTasks.length,
      overdueTasks: openTasks.filter((task) => task.due_date && toDate(task.due_date) < new Date()).length,
      pendingDocs: pendingDocs.length,
      outstanding,
      overdueInvoices: overdueInvoices.length,
      receiptsToReview: receiptsToReview.length,
      openSupport: openSupport.length,
    };
    person.nextAction =
      openTasks.sort((a, b) => (toDate(a.due_date)?.getTime() || Infinity) - (toDate(b.due_date)?.getTime() || Infinity))[0] ||
      null;
  }

  return Array.from(people.values()).sort(
    (a, b) => (toDate(b.lastActivityAt)?.getTime() || 0) - (toDate(a.lastActivityAt)?.getTime() || 0)
  );
}

export function isDone(status) {
  return ["completed", "done", "closed", "cancelled"].includes(String(status || "").toLowerCase());
}

export function personMatches(person, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    person.name,
    person.email,
    person.phone,
    person.country,
    ...person.applications.map((app) => `${app.university} ${app.program}`),
  ]
    .join(" ")
    .toLowerCase();
  return needle.split(/\s+/).every((part) => haystack.includes(part));
}

export function isLead(person) {
  return LEAD_STAGES.includes(person.stage);
}

export function isStudent(person) {
  return STUDENT_STAGES.includes(person.stage);
}

/* ------------------------------- duplicates ------------------------------- */

function contactKeys(person) {
  const keys = new Set();
  const add = (email, phone) => {
    const mail = String(email || "").trim().toLowerCase();
    if (mail.includes("@")) keys.add(`e:${mail}`);
    // Last 10 digits, so 0300…, +92300… and 92300… all count as one number.
    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length >= 9) keys.add(`p:${digits.slice(-10)}`);
  };
  add(person.email, person.phone);
  for (const source of person.sources) add(source.row.email, source.row.phone);
  return keys;
}

/**
 * People who look like the same person because they share a phone number or
 * an email address. Returns Map(personId → [the other people]).
 */
export function findDuplicates(people) {
  const byKey = new Map();
  for (const person of people) {
    for (const key of contactKeys(person)) {
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(person);
    }
  }
  const result = new Map();
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    for (const person of group) {
      const others = result.get(person.id) || [];
      for (const other of group) {
        if (other.id !== person.id && !others.includes(other)) others.push(other);
      }
      result.set(person.id, others);
    }
  }
  return result;
}

function fileWeight(person) {
  return (
    person.applications.length + person.documents.length + person.invoices.length + person.payments.length + person.visas.length + person.tasks.length + person.notes.length
  );
}

/**
 * Which of two files stays when they are merged: the one with a student
 * login, else the one further along, else the one with more in it, else the
 * older one. Returns [keep, other].
 */
export function pickKeeper(a, b) {
  const score = (person) => [
    person.identity?.auth_user_id ? 1 : 0,
    person.stage === "closed" ? -1 : stageIndex(person.stage),
    fileWeight(person),
    -(toDate(person.createdAt)?.getTime() || 0),
  ];
  const left = score(a);
  const right = score(b);
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] > right[index] ? [a, b] : [b, a];
  }
  return [a, b];
}
