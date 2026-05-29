import { supabase } from "../../lib/supabaseClient";

export async function fetchInquiryRows() {
  return supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function deleteInquiryRow(id) {
  return supabase.from("inquiries").delete().eq("id", id);
}

export async function updateInquiryStatusRow(id, status) {
  return supabase.from("inquiries").update({ status }).eq("id", id);
}

export async function updateInquiryPriorityRow(id, priority) {
  return supabase.from("inquiries").update({ priority }).eq("id", id);
}