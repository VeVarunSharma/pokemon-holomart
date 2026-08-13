/**
 * Saved Searches preview boundary
 *
 * IMPLEMENTED: versioned create, read, apply, rename, update, and delete flows
 * with active/edited state and stale-criteria recovery in localStorage.
 * NOT IMPLEMENTED: account persistence, multi-device sync, price alerts,
 * alert preferences, cross-device conflict handling, usage telemetry,
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
