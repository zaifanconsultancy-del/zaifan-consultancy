// Students get their OWN Supabase session (separate storage key), so a staff
// member can be signed in to /admin and test /student in the same browser
// without one login kicking the other out.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const studentSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "zaifan-student-session",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
