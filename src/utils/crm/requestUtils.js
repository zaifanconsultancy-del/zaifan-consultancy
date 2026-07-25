import { REQUEST_TIMEOUT_MS } from "./constants";

function normalizeDelay(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function withTimeout(
  promiseLike,
  label = "Request",
  timeoutMs = REQUEST_TIMEOUT_MS
) {
  const safeTimeoutMs = normalizeDelay(timeoutMs, REQUEST_TIMEOUT_MS);
  let timerId;

  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(`${String(label || "Request").trim()} timed out.`));
    }, safeTimeoutMs);
  });

  try {
    return await Promise.race([
      Promise.resolve(promiseLike),
      timeoutPromise,
    ]);
  } finally {
    if (timerId) {
      clearTimeout(timerId);
    }
  }
}

export function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, normalizeDelay(ms, 0));
  });
}