import { useCallback, useEffect, useState } from "react";

import { allUniversities } from "../../../data/universities";

const STORAGE_KEY = "zaifan-uni-shortlist";
const CHANGE_EVENT = "zaifan-uni-shortlist-change";
export const MAX_COMPARE = 3;

function read() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((key) => allUniversities.some((university) => university.key === key)) : [];
  } catch {
    return [];
  }
}

function write(keys) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // Private mode or blocked storage: the shortlist just lasts for this visit.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: keys }));
}

/** The visitor's saved universities, shared by the finder and every profile page. */
export function useShortlist() {
  const [keys, setKeys] = useState(read);

  useEffect(() => {
    const sync = (event) => setKeys(event.detail ?? read());
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  const toggle = useCallback((key) => {
    const current = read();
    write(current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }, []);

  const remove = useCallback((key) => write(read().filter((item) => item !== key)), []);
  const clear = useCallback(() => write([]), []);

  const picks = keys.map((key) => allUniversities.find((university) => university.key === key)).filter(Boolean);

  return { keys, picks, toggle, remove, clear, has: (key) => keys.includes(key) };
}
