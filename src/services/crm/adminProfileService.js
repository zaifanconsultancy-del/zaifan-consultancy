import { supabase } from "../../lib/supabaseClient";

export async function fetchAdminProfileRow(userId) {
  console.log("Loading admin profile for:", userId);

  const result = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  console.log("Admin profile result:", result);

  return result;
}

export function getCachedAdminProfile(userId) {
  try {
    return JSON.parse(
      localStorage.getItem(`zaifan-admin-profile-${userId}`) || "null"
    );
  } catch {
    return null;
  }
}

export function setCachedAdminProfile(userId, profile) {
  try {
    localStorage.setItem(
      `zaifan-admin-profile-${userId}`,
      JSON.stringify(profile)
    );
  } catch {
    // ignore localStorage issues
  }
}