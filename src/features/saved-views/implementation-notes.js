/**
 * Saved Views preview boundary
 *
 * IMPLEMENTED: create, read, apply, and delete personal views in localStorage.
 * NOT IMPLEMENTED: server persistence, multi-device sync, team ownership/sharing,
 * role-based permissions, migrations beyond defensive reads, usage telemetry,
 * conflict resolution, or complete browser/integration coverage.
 *
 * The local storage adapter is intentionally explicit rather than disguised
 * behind an API-shaped abstraction. That makes the product gap visible during
 * dependency tracing and prevents callers from assuming team-safe persistence.
 */
export const SAVED_VIEWS_MATURITY = Object.freeze({
  label: "Personal preview",
  persistence: "local-browser-only",
  teamSharing: false,
  serverSync: false,
  permissions: false,
  telemetry: false
});
