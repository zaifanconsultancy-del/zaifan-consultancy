import { REQUEST_TIMEOUT_MS } from "./constants";

export function withTimeout(promise, label = "Request") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out.`)),
        REQUEST_TIMEOUT_MS
      )
    ),
  ]);
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}