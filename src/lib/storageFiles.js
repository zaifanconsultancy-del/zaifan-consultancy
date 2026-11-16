import { supabase } from "./supabaseClient";

// Student files live in PRIVATE buckets. Older rows still store a "public" URL,
// so we turn that URL back into bucket + path and ask Supabase for a link that
// only works for a few minutes (and only for signed-in staff).
const PUBLIC_MARKER = "/storage/v1/object/public/";
const LINK_SECONDS = 300;

export const DOCUMENTS_BUCKET = "student-documents";
export const RECEIPTS_BUCKET = "student-receipts";

export function parseStorageUrl(url) {
  if (!url || typeof url !== "string") return null;
  const index = url.indexOf(PUBLIC_MARKER);
  if (index === -1) return null;

  const rest = url.slice(index + PUBLIC_MARKER.length).split("?")[0];
  const slash = rest.indexOf("/");
  if (slash === -1) return null;

  return {
    bucket: rest.slice(0, slash),
    path: decodeURIComponent(rest.slice(slash + 1)),
  };
}

/** Accepts a stored public URL, or { bucket, path }. */
function resolveTarget(target, defaultBucket = DOCUMENTS_BUCKET) {
  if (!target) return null;
  if (typeof target === "object" && target.path) {
    return { bucket: target.bucket || defaultBucket, path: target.path };
  }
  if (typeof target === "string") {
    if (/^https?:\/\//.test(target)) return parseStorageUrl(target);
    return { bucket: defaultBucket, path: target };
  }
  return null;
}

export async function getPrivateFileUrl(target, { download, bucket } = {}) {
  const resolved = resolveTarget(target, bucket);
  if (!resolved) return typeof target === "string" ? target : "";

  const { data, error } = await supabase.storage
    .from(resolved.bucket)
    .createSignedUrl(resolved.path, LINK_SECONDS, download ? { download } : undefined);

  if (error || !data?.signedUrl) {
    throw new Error("This file could not be opened. Please sign in again and retry.");
  }

  return data.signedUrl;
}

// Opens the tab straight away (so the browser doesn't block it as a pop-up),
// then points it at the private link once it's ready.
export async function openPrivateFile(target, options) {
  const tab = window.open("", "_blank");
  try {
    const signedUrl = await getPrivateFileUrl(target, options);
    if (tab) {
      tab.opener = null;
      tab.location.href = signedUrl;
    } else {
      window.location.assign(signedUrl);
    }
  } catch (error) {
    if (tab) tab.close();
    throw error;
  }
}

export async function downloadPrivateFile(target, fileName, options = {}) {
  const signedUrl = await getPrivateFileUrl(target, { ...options, download: fileName || true });
  const link = document.createElement("a");
  link.href = signedUrl;
  link.rel = "noreferrer";
  if (fileName) link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function safeFileName(name = "file") {
  return String(name)
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-120);
}

/** Uploads into the private bucket and returns { path, url } (url = public-style, for older code paths). */
export async function uploadPrivateFile({ bucket = DOCUMENTS_BUCKET, path, file }) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data?.publicUrl || "" };
}
