// "Download list": saves the people on screen as a .csv file that opens in
// Excel or Google Sheets (one row per person).

import { fmtDate, fmtMoneyList, toDate } from "./format";
import { STAGE_BY_ID } from "./people";

const DONE_DOCS = ["verified", "approved"];

function cell(value) {
  let text = value === null || value === undefined ? "" : String(value);
  // Excel runs cells that start with = + - @ as formulas (and "+92…" turns
  // into a number). A leading tab keeps them as plain text.
  if (/^[=+\-@]/.test(text)) text = `\t${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

const firstSource = (person) => [...person.sources].sort((a, b) => (toDate(a.createdAt)?.getTime() || 0) - (toDate(b.createdAt)?.getTime() || 0))[0];

const COLUMNS = [
  ["Name", (p) => p.name],
  ["Phone", (p) => p.phone],
  ["Email", (p) => p.email],
  ["Stage", (p) => STAGE_BY_ID[p.stage]?.label || p.stage],
  ["Country", (p) => p.country],
  ["University", (p) => p.applications[0]?.university || ""],
  ["Course", (p) => p.applications[0]?.program || ""],
  ["Intake", (p) => p.applications[0]?.intake || ""],
  ["Counselor", (p, ctx) => ctx.staffById.get(p.assignedTo)?.name || ""],
  ["Priority", (p) => p.priority],
  ["First contact", (p) => fmtDate(p.createdAt, { withYear: true })],
  ["Came from", (p) => firstSource(p)?.label || ""],
  ["Documents checked", (p) => (p.documents.length ? `${p.documents.filter((doc) => DONE_DOCS.includes(String(doc.status || "").toLowerCase())).length} of ${p.documents.length}` : "")],
  ["Open tasks", (p) => p.counts.openTasks || 0],
  ["Next step", (p) => p.nextAction?.title || ""],
  ["Next step due", (p) => fmtDate(p.nextAction?.due_date, { withYear: true })],
  ["Billed", (p) => fmtMoneyList(p.money.invoiced, "")],
  ["Paid", (p) => fmtMoneyList(p.money.paid, "")],
  ["Still due", (p) => fmtMoneyList(p.money.due, "")],
  ["Last activity", (p) => fmtDate(p.lastActivityAt, { withYear: true })],
];

/** Builds the CSV text (exported separately so it is easy to check). */
export function peopleCsv(people, { staffById = new Map() } = {}) {
  const ctx = { staffById };
  const rows = [COLUMNS.map(([label]) => cell(label)).join(",")];
  for (const person of people) rows.push(COLUMNS.map(([, get]) => cell(get(person, ctx))).join(","));
  return rows.join("\r\n");
}

/** Downloads e.g. "zaifan-students-2026-11-14.csv". Returns how many rows. */
export function downloadPeopleList(people, { staffById, name = "people" } = {}) {
  // The BOM makes Excel read names and "Rs" correctly.
  const blob = new Blob(["﻿", peopleCsv(people, { staffById })], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `zaifan-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return people.length;
}
