/**
 * Saved Searches preview boundary
 *
 * IMPLEMENTED: create, read, apply, and delete personal searches in localStorage.
 * NOT IMPLEMENTED: account persistence, multi-device sync, price alerts,
 * alert preferences, migrations beyond defensive reads, usage telemetry,
 * notification delivery, or complete browser/integration coverage.
 *
 * The local storage adapter is intentionally explicit rather than disguised
 * behind an API-shaped abstraction. That makes the product gap visible during
 * dependency tracing and prevents callers from assuming account-safe persistence.
 */
export const SAVED_SEARCHES_MATURITY = Object.freeze({
  label: "Personal preview",
  persistence: "local-browser-only",
  accountSync: false,
  priceAlerts: false,
  notifications: false,
  telemetry: false
});
