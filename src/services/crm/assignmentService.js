import { supabase } from "../../lib/supabaseClient";

export async function fetchAssignmentsForLeadTypeRows(leadType, ids = []) {
  if (!ids.length) {
    return { data: [], error: null };
  }

  return supabase
    .from("lead_assignments")
    .select("*")
    .eq("lead_type", leadType)
    .in(
      "lead_id",
      ids.map((id) => String(id))
    );
}

export function getUniqueAssignments(assignments = []) {
  const uniqueAssignments = [];
  const seen = new Set();

  for (const assignment of assignments) {
    const key = `${assignment.lead_type}-${assignment.lead_id}`;

    if (!seen.has(key)) {
      seen.add(key);
      uniqueAssignments.push(assignment);
    }
  }

  return uniqueAssignments;
}