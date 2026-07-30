# Demo operations

This is the presenter checklist and recovery playbook. It never resets Git, deletes work, enables MCP, or writes to GitHub.

## Preflight (day before and 15 minutes before)

From PowerShell at the repository root:

```powershell
git --version
node --version
npm --version
npm run demo:check
```

- Node must be 20 or newer. GitHub CLI and authentication are optional because the demo performs no remote writes. If `gh` is installed, check it separately:

  ```powershell
  gh --version
  gh auth status
  ```
- Read the synthetic-data banner and ensure no real customer/design data has been added.
- Start the app with `npm start`; verify <http://127.0.0.1:4173> loads and says “synthetic signals.”
- Filter, save, apply, and delete a throwaway local Saved View.
- Open the Copilot app in the repository and confirm repository prompts/agents are visible.
- Ask Copilot to reload extensions from disk, then open Roadmap Studio focused on `init-saved-views-preview`.
- Keep `product/roadmap.json`, `design/local-design-context.json`, and issue preview output ready as fallbacks.
- If using Figma, follow [Figma MCP](figma-mcp.md) in advance and explicitly verify authentication plus selected-file permission. Never discover/authenticate on stage.

`npm run demo:check` runs artifact validation, all Node tests, and JSON issue generation. It does not install packages or use the network.

## Start and ports

Default:

```powershell
npm start
```

Signal Desk binds only to `127.0.0.1:4173`. If occupied, choose a local port in PowerShell:

```powershell
$env:PORT=4174; npm start
```

Then open <http://127.0.0.1:4174>. Stop the server with `Ctrl+C`. If you start on another port, reuse the same `PORT` value for `npm run demo:reset` so the reset helper points at the matching browser origin. Roadmap Studio uses an ephemeral loopback port selected by the operating system; do not hard-code or expose it.

To identify a default-port conflict without terminating anything:

```powershell
Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue
```

## Safe reset

Run:

```powershell
npm run demo:reset
```

The helper only prints the reset checklist. It does not change files or browser storage. If the app is running on 4174, use the same environment variable for reset:

```powershell
$env:PORT=4174; npm run demo:reset
```

Reset the visible demo safely:

1. In Signal Desk, delete throwaway Saved Views with each **×** control.
2. Clear filters with **Clear** and navigate back to the same loopback origin shown by the helper.
3. If malformed storage must be removed, use browser DevTools → **Application** → **Local storage** → that loopback origin and remove only `signal-desk.saved-views.v1`, then reload.
4. Close the Roadmap Studio panel and ask Copilot to reopen it; its in-memory focus/filter state is not written to the roadmap.
5. Stop and restart `npm start` if needed.
6. Run `npm run demo:check`.

Never use `git reset`, `git checkout`, `git restore`, `git clean`, broad site-data clearing, or deletion of a presenter’s work as a demo reset.

## Fallback ladder

### No Figma

Say “Figma is optional and not authenticated in this path.” Use:

- `design/local-design-context.json`
- `design/saved-views-ux-brief.md`
- `design/tokens.json`

Prompt:

```text
/figma-ux-review Review Saved Views using only the committed local design fallback. Mark unverifiable visual judgments unknown.
```

### No canvas

Do not debug on stage. Open `product/roadmap.json` and run:

```powershell
npm run issues:preview:json
```

The roadmap JSON and generator carry the same stable IDs, risks, decisions, evidence references, and issue ordering used by Roadmap Studio.

### No network

The app, tests, local evidence, design fallback, roadmap skill instructions, validation, generator, and canvas model/tests are repository-local. Use:

```powershell
npm run demo:check
npm start
```

Skip Figma, GitHub auth, remote links, and any live MCP/market lookup. Copilot responses that require a network may be replaced by the named local prompt files and deterministic generator output.

### Prompt or extension not discovered

For a prompt, paste its natural-language fallback from the [facilitator guide](facilitator-guide.md) and cite the file under `.github/prompts/`.

For Roadmap Studio:

1. Confirm Copilot opened this repository root.
2. Ask: `Reload all extensions from disk.`
3. Retry the exact canvas prompt.
4. If reload is unavailable, restart the Copilot session once.
5. Fall back to roadmap JSON immediately.

Do not edit extension code, install packages, or expose the ephemeral loopback port during the talk.

## Troubleshooting

| Symptom | Safe action |
| --- | --- |
| `node` missing or below 20 | Use a preinstalled supported Node LTS; do not install live on stage. |
| Port 4173 busy | Set `$env:PORT=4174; npm start`, then reuse `$env:PORT=4174; npm run demo:reset`; do not kill an unknown process. |
| Blank/stale page | Confirm the printed URL, hard refresh, then restart only the known server with `Ctrl+C`. |
| Saved View persists | Delete in UI or remove only `signal-desk.saved-views.v1` for the correct loopback origin. |
| Artifact validation fails | Read the exact missing/invalid path; switch to a known-good presenter copy. |
| `gh auth status` fails | Continue locally. Authentication is not required for previews. |
| Figma asks for login/consent | Stop and use local design fallback; do not authenticate on stage. |
| Roadmap canvas missing | Reload extensions once, then use roadmap JSON + generator. |
| Copilot cannot reach network | Use local files, tests, prompts, and deterministic output. |
| Generator prints `gh` commands | Show only; never paste/run them. `--apply` is intentionally unsupported. |

## Avoiding real remote writes

- Use only `npm run issues:preview`, `npm run issues:preview:json`, or the generator’s `--gh-commands` display mode.
- Never run a printed command, `gh issue create`, Project mutation, Figma comment/write, or MCP write during the session.
- Preview/scope approval is not remote-write approval.
- Keep tokens and MCP configuration out of the repository.
- If the audience requests a write, explain the separate approval checkpoint and stop at the preview.
