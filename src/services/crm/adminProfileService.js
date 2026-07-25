import { supabase } from "../../lib/supabaseClient";

const CACHE_PREFIX = "zaifan-admin-profile-";

function normalizeUserId(userId) {
  return String(userId ?? "").trim();
}

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getCacheKey(userId) {
  const normalizedUserId = normalizeUserId(userId);
  return normalizedUserId ? `${CACHE_PREFIX}${normalizedUserId}` : "";
}

export async function fetchAdminProfileRow(userId) {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return {
      data: null,
      error: new Error("Missing admin user ID."),
    };
  }

  return supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", normalizedUserId)
    .maybeSingle();
}

export function getCachedAdminProfile(userId) {
  const key = getCacheKey(userId);
  const storage = getStorage();

  if (!key || !storage) return null;

  try {
    const raw = storage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function setCachedAdminProfile(userId, profile) {
  const key = getCacheKey(userId);
  const storage = getStorage();

  if (!key || !storage) return;

  try {
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      storage.removeItem(key);
      return;
    }

    storage.setItem(key, JSON.stringify(profile));
  } catch {
    // Cache failure must never block admin authentication.
  }
}