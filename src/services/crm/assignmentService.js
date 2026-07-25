import { supabase } from "../../lib/supabaseClient";

function normalizeLeadType(value = "") {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeIds(ids = []) {
  if (!Array.isArray(ids)) return [];

  const seen = new Set();
  const normalized = [];

  for (const id of ids) {
    if (id === null || id === undefined) continue;

    const value = String(id).trim();
    if (!value || seen.has(value)) continue;

    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

export async function fetchAssignmentsForLeadTypeRows(
  leadType,
  ids = []
) {
  const normalizedLeadType = normalizeLeadType(leadType);
  const normalizedIds = normalizeIds(ids);

  if (!normalizedLeadType || normalizedIds.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from("lead_assignments")
    .select("*")
    .eq("lead_type", normalizedLeadType)
    .in("lead_id", normalizedIds);
}

export function getUniqueAssignments(assignments = []) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return [];
  }

  const uniqueAssignments = [];
  const seen = new Set();

  for (const assignment of assignments) {
    if (!assignment) continue;

    const leadType = normalizeLeadType(assignment.lead_type);
    const leadId =
      assignment.lead_id === null || assignment.lead_id === undefined
        ? ""
        : String(assignment.lead_id).trim();

    if (!leadType || !leadId) continue;

    const key = `${leadType}-${leadId}`;

    if (seen.has(key)) continue;

    seen.add(key);
    uniqueAssignments.push(assignment);
  }

  return uniqueAssignments;
}