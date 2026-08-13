# Demo operations

This checklist runs and resets the local HoloMart demo without destructive Git operations.

## Preflight

From PowerShell at the repository root:

```powershell
git --version
node --version
npm --version
npm run demo:check
npm start
```

Verify <http://127.0.0.1:4173>:

1. Search for `Pikachu`.
2. Filter to **Special Illustration Rare**.
3. Save a throwaway search.
4. Reapply and delete it.
5. Add a listing to the demo cart.
6. Confirm the footer identifies synthetic data and abstract card visuals.

For the AI-assisted testing, independent assertion review, deterministic
browser evidence, seeded exploratory replay, and approval-gated dispatch
commands, use the [Agentic QA demo runbook](agentic-qa-demo.md).

Ask Copilot to reload extensions and open Roadmap Studio focused on `init-saved-searches-preview`. Keep `product/roadmap.json`, `design/local-design-context.json`, and `npm run issues:preview:json` ready as fallbacks.

## Ports

The server binds to loopback only:

```powershell
npm start
```

If port 4173 is occupied:

```powershell
$env:PORT=4174; npm start
```

Use the same value for reset:

```powershell
$env:PORT=4174; npm run demo:reset
```

Inspect a conflict without stopping an unknown process:

```powershell
Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue
```

## Safe reset

```powershell
npm run demo:reset
```

The helper only prints instructions. To reset manually:

1. Delete throwaway Saved Searches with each **×** control.
2. Clear filters and return to the app root.
3. For malformed local state only, remove `holomart.saved-searches.v1` from this loopback origin in browser DevTools.
4. Close and reopen Roadmap Studio to clear in-memory focus.
5. Restart the known `npm start` process if needed.
6. Run `npm run demo:check`.

Never use `git reset`, `git checkout`, `git restore`, `git clean`, broad site-data deletion, or deletion of presenter work as a demo reset.

## Fallback ladder

### No Figma

Use:

- `design/local-design-context.json`
- `design/saved-searches-ux-brief.md`
- `design/tokens.json`

```text
/figma-ux-review Review HoloMart Saved Searches using only the committed local design fallback.
```

### No canvas

```powershell
npm run issues:preview:json
```

The roadmap JSON and generator carry the same IDs, risks, decisions, evidence, and dependency order as Roadmap Studio.

### No network

```powershell
npm run demo:check
npm start
```

The storefront, evidence, design fallback, tests, roadmap, issue preview, and canvas model are repository-local.

## Troubleshooting

| Symptom | Safe action |
| --- | --- |
| Node missing or below 20 | Use a preinstalled supported Node LTS. |
| Port busy | Select another `PORT`; do not kill an unknown process. |
| Blank page | Confirm the printed URL, hard refresh, then restart only the known server. |
| Saved Search persists | Delete it in the UI or remove only `holomart.saved-searches.v1`. |
| Validation fails | Read the exact missing or invalid path before presenting. |
| Figma asks for login | Stop and use the local design fallback. |
| Roadmap canvas is unavailable | Reload extensions once, then use roadmap JSON and generator. |

## GitHub writes

The repository generator is intentionally preview-only. When real issues or a Project are requested, review the exact roadmap, authenticate with the intended account, create remote resources deliberately, and retain the stable `init-*` and `work-*` IDs in issue bodies.
