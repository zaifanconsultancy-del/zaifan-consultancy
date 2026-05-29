import { supabase } from "../../lib/supabaseClient";

export async function fetchFollowUpReminderRows() {
  return supabase
    .from("follow_up_reminders")
    .select("*")
    .order("due_date", { ascending: true });
}