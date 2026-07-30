/**
 * Source-adjacent feature dependency map for impact analysis.
 *
 * UI (app/app.js)
 *   ├─ filter state ──> feedback data
 *   ├─ share serializer ──> filter state
 *   ├─ CSV export ──> currently filtered feedback
 *   └─ Saved Views preview
 *        ├─ local storage adapter ──> filter normalization
 *        └─ maturity notes
 *
 * A production implementation would add:
 * Saved Views -> views API -> auth/permissions -> team/workspace model
 *             -> telemetry events -> sync/conflict handling
 */
export const SAVED_VIEWS_DEPENDENCIES = Object.freeze({
  current: ["app/app.js", "filter-state.js", "storage.js", "implementation-notes.js"],
  adjacent: ["share-state.js", "csv.js", "feedback.js"],
  missing: ["views-api", "workspace-model", "permissions", "telemetry", "sync-conflicts"]
});
