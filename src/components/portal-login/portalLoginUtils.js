// Non-component helpers shared by the portal sign-in pages.

export const NAVY = "#071f50";
export const CREAM = "#fff7ed";

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}
