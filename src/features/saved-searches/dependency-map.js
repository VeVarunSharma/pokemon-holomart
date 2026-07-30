/**
 * Source-adjacent feature dependency map for impact analysis.
 *
 * UI (app/app.js)
 *   ├─ filter state ──> card catalog
 *   ├─ share serializer ──> filter state
 *   ├─ CSV export ──> currently filtered cards
 *   └─ Saved Searches preview
 *        ├─ local storage adapter ──> filter normalization
 *        └─ maturity notes
 *
 * A production implementation would add:
 * Saved Searches -> account API -> shopper identity -> multi-device sync
 *                -> price service -> alert preferences -> notifications
 */
export const SAVED_SEARCHES_DEPENDENCIES = Object.freeze({
  current: ["app/app.js", "filter-state.js", "storage.js", "implementation-notes.js"],
  adjacent: ["share-state.js", "csv.js", "cards.js"],
  missing: ["account-api", "price-service", "alert-preferences", "notifications", "sync-conflicts"]
});
