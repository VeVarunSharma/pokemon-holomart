# Agentic QA demo

This runbook demonstrates a bounded AI-assisted quality loop for HoloMart.
HoloMart and every fixture, listing, seller, inventory count, and price in the
demo are **SYNTHETIC / DEMO-ONLY**. No real shopper, seller, payment, inventory,
pricing, credential, token, copyrighted card artwork, or production integration
belongs in the run or its evidence.

The implementation separates two kinds of evidence:

- Six deterministic gates are blocking: artifact validation, focused unit
  contracts, integration contracts, the full Node suite, issue-preview
  integration, and seven browser journeys
  (`scripts/agentic-qa-evidence.mjs:25-41`,
  `scripts/agentic-qa-evidence.mjs:426-506`).
- A fresh workflow agent independently challenges changed-test assertion
  strength, then performs exactly three seed-selected exploratory charters. Its
  observations are advisory and cannot override a deterministic failure
  (`.github/workflows/holomart-agentic-qa.md:237-338`).

The workflow source is
`.github/workflows/holomart-agentic-qa.md`; the generated lock is
`.github/workflows/holomart-agentic-qa.lock.yml`.

## Safety model

- Pull requests test the event's immutable head SHA; manual runs require full
  head and base SHAs. The harness rejects a checkout or evidence bundle that
  names another revision
  (`.github/workflows/holomart-agentic-qa.md:5-48`,
  `scripts/agentic-qa-evidence.mjs:284-370`).
- Repository permissions are read-only. `copilot-requests: write` authorizes
  inference, not repository content mutation. GitHub and edit tools are
  disabled, checkout credentials do not persist, and the compiled lock contains
  no issue, PR, comment, check, code-push, or repository-dispatch output
  (`.github/workflows/holomart-agentic-qa.md:34-37`,
  `.github/workflows/holomart-agentic-qa.md:78-159`).
- The only structured safe output records `pass`, `fail`, or `blocked` in run
  evidence. It has no network or repository-write capability
  (`.github/workflows/holomart-agentic-qa.md:111-147`).
- Deterministic browser output uses a pinned Playwright runtime outside the
  checkout. Browser cases `QA-01` through `QA-07` cover boot and trust context,
  filters and URL state, empty recovery, local Saved Searches, demo cart,
  filtered CSV, keyboard use, and 320px reflow
  (`scripts/agentic-qa-browser.cjs:16-52`).
- Evidence is outside the checkout, bounded to 2 MB for the diff, 8 MB per
  command log, 10 MB per file, and 50 MB for the bundle. The uploaded artifact
  is retained for seven days. After a successful upload, its staging directory
  is removed before gh-aw assembles its compiler-managed diagnostic artifact,
  preventing a second copy with repository-default retention
  (`scripts/agentic-qa-evidence.mjs:21-24`,
  `.github/workflows/holomart-agentic-qa.md:200-232`).
- Repository cleanliness is checked before and after execution so generated
  browser or tool files cannot silently become evidence
  (`scripts/agentic-qa-evidence.mjs:284-297`,
  `scripts/agentic-qa-evidence.mjs:734-750`).

## 1. Compile and audit locally

Install or update the official `gh-aw` extension through the approved
environment process, then confirm the expected compiler:

```powershell
gh aw version
```

This repository expects `v0.85.4`, whose verified public release commit is
`53843da968225dc56e1590978a7ed6407a8438ac`. Validate and compile the named
workflow with that immutable action ref:

```powershell
gh aw validate holomart-agentic-qa --strict --no-check-update
gh aw compile holomart-agentic-qa --action-mode release --action-tag 53843da968225dc56e1590978a7ed6407a8438ac --no-check-update
```

Remove only known compiler/scanner side files if the local gh-aw installation
created them. They are not workflow deliverables:

```powershell
Remove-Item .github\aw\actions-lock.json, .poutine.yml -ErrorAction SilentlyContinue
```

Run the repository and workflow-safety checks:

```powershell
npm run test:unit -- test/unit/agentic-qa-evidence.test.js
npm run demo:check

$lock = ".github\workflows\holomart-agentic-qa.lock.yml"
$forbidden = Select-String -Path $lock -Pattern `
  "issues: write|contents: write|pull-requests: write|checks: write|actions: write|safe_outputs_auto_create_issue|create_issue|add_comment|create_pull_request"
if ($forbidden) {
  $forbidden
  throw "Compiled workflow exposes a prohibited write path."
}

git diff --check
git status --short
```

To prove lock freshness on a clean committed revision, compare its hash before
and after compilation:

```powershell
$lock = ".github\workflows\holomart-agentic-qa.lock.yml"
$before = (Get-FileHash -Algorithm SHA256 $lock).Hash
gh aw compile holomart-agentic-qa --action-mode release --action-tag 53843da968225dc56e1590978a7ed6407a8438ac --no-check-update
if ($LASTEXITCODE -ne 0) { throw "gh-aw compilation failed." }
$after = (Get-FileHash -Algorithm SHA256 $lock).Hash
if ($before -ne $after) { throw "The committed lock was stale." }
```

Do not dispatch the remote workflow as part of compilation or validation.

## 2. Replay the deterministic evidence locally

Use a clean checkout because cleanliness is an evidence invariant. The commands
below install Playwright into a temporary directory, not the repository:

```powershell
if (git status --porcelain=v1 --untracked-files=all) {
  throw "Use a clean checkout for immutable QA evidence."
}

$head = (git rev-parse HEAD).Trim().ToLowerInvariant()
$base = (git merge-base origin/main $head).Trim().ToLowerInvariant()
$runtime = Join-Path $env:TEMP "holomart-playwright-1.51.1"
$browsers = Join-Path $env:TEMP "holomart-playwright-browsers-1.51.1"
$evidence = Join-Path $env:TEMP "holomart-agentic-qa-$head"

npm install --prefix $runtime --no-save --ignore-scripts --no-audit --no-fund playwright@1.51.1
if ($LASTEXITCODE -ne 0) { throw "Playwright runtime installation failed." }

$env:NODE_PATH = Join-Path $runtime "node_modules"
$env:PLAYWRIGHT_BROWSERS_PATH = $browsers
node (Join-Path $runtime "node_modules\playwright\cli.js") install chromium
if ($LASTEXITCODE -ne 0) { throw "Chromium installation failed." }

$env:QA_ARTIFACT_DIR = $evidence
$env:QA_BASE_URL = "http://127.0.0.1:4173"
$env:QA_HEAD_SHA = $head
$env:QA_BASE_SHA = $base
$env:QA_SEED_INPUT = "auto"
$env:QA_EVENT_NAME = "local"
$env:QA_REPOSITORY = "VeVarunSharma/github-copilot-for-product"
$env:QA_RUN_ID = "local-$($head.Substring(0, 8))"

node scripts\agentic-qa-evidence.mjs prepare
if ($LASTEXITCODE -ne 0) { throw "Evidence preparation failed." }

node scripts\agentic-qa-evidence.mjs run
$runExit = $LASTEXITCODE
node scripts\agentic-qa-evidence.mjs finalize
$finalizeExit = $LASTEXITCODE
node scripts\agentic-qa-evidence.mjs enforce
$enforceExit = $LASTEXITCODE

if ($runExit -ne 0 -or $finalizeExit -ne 0 -or $enforceExit -ne 0) {
  throw "One or more deterministic QA phases failed. Inspect $evidence."
}
```

`prepare` starts only the known loopback server. `finalize` stops that recorded
PID, checks the tested revision and clean checkout again, validates result
schemas, inventories the bundle, and writes SHA-256 checksums
(`scripts/agentic-qa-evidence.mjs:724-830`).

To replay the same stochastic inputs, replace `auto` with the unsigned integer
from `manifest.json`. The same head SHA, base SHA, seed, charter order, and paths
are replayable. Model reasoning is not deterministic and must not be presented
as such.

## 3. Presentation sequence

1. **Issue and implementation context:** show the issue or local issue preview,
   the implementation diff, and any test-generation session. Do not claim a
   test is AI-generated unless that provenance was captured explicitly.
2. **Generated or PR-added tests:** show what observable behavior each new test
   claims to protect. Test count and coverage are context, not proof.
3. **Deterministic loop:** open `deterministic-report.md` and
   `browser-report.md`. A failed gate blocks the run.
4. **Independent review:** show the workflow agent's separate classification:
   `strong`, `useful but incomplete`, `weak`, `vanity`, or `unverified`.
   Emphasize whether a plausible behavior-breaking mutation would make the
   assertion fail.
5. **Seeded exploration:** show `exploration-plan.json`, the exact action
   sequence, and `exploratory\explore-1.png` through
   `exploratory\explore-3.png`. A suspicion remains unverified until it has a
   deterministic reproduction.
6. **Quality loop:** convert a confirmed gap into a reviewed issue preview,
   implement it in a separate session, generate focused tests, and run this
   independent workflow again.

Vanity-test signals to call out include assertions that only prove execution,
element existence, mock invocation, a snapshot without semantic checks, or a
coverage increase. Stronger evidence reaches production behavior and fails for
a realistic wrong result, boundary, recovery, or state-transition mutation.

## 4. Approval-gated remote dispatch preview

`workflow_dispatch` creates a GitHub Actions run and is therefore a remote
mutation. Do not execute this command without explicit human approval after the
workflow source and compiled lock are on the selected ref:

```powershell
$revision = "<full-40-character-head-sha>"
$baseRevision = "<full-40-character-base-sha>"
$seed = "auto"

gh workflow run holomart-agentic-qa.lock.yml `
  --ref main `
  -f revision=$revision `
  -f base_revision=$baseRevision `
  -f seed=$seed
```

The command above is a preview only in this runbook; this implementation did not
execute it. Pull-request events can also start the workflow after it is merged
or otherwise present on the repository's workflow ref.

## 5. Download and verify run evidence

These commands are read-only except for writing the downloaded files locally:

```powershell
$runId = 123456789
$destination = Join-Path $env:TEMP "holomart-agentic-qa-run-$runId"

gh run view $runId
gh run download $runId -n holomart-agentic-qa-evidence -D $destination

Get-Content (Join-Path $destination "manifest.json") | ConvertFrom-Json | Format-List
Get-Content (Join-Path $destination "finalization.json") | ConvertFrom-Json | Format-List
Get-Content (Join-Path $destination "independent-verdict.json") | ConvertFrom-Json | Format-List
Get-Content (Join-Path $destination "deterministic-report.md")
Get-Content (Join-Path $destination "browser-report.md")
Get-Content (Join-Path $destination "independent-review.md")
```

Verify every listed checksum:

```powershell
Push-Location $destination
try {
  Get-Content checksums.sha256 | ForEach-Object {
    if ($_ -notmatch "^([0-9a-f]{64})  (.+)$") {
      throw "Malformed checksum line: $_"
    }
    $expected = $Matches[1]
    $file = $Matches[2]
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $file).Hash.ToLowerInvariant()
    if ($actual -ne $expected) { throw "Checksum mismatch: $file" }
  }
} finally {
  Pop-Location
}
```

The `holomart-agentic-qa-evidence` artifact is retained for seven days. Download
it before expiry when it is needed for a presentation or follow-up.

## 6. Issue to independent-review loop

The repository's deterministic issue generator remains preview-only:

```powershell
npm run issues:preview:json
```

For a live demonstration:

1. Capture an issue preview and obtain separate approval before any remote issue
   creation.
2. Implement the approved scope in one Copilot session.
3. Ask that implementation session to add behavior-focused tests under
   `test\**` and retain explicit generated-test provenance in the session or PR.
4. Let the HoloMart Agentic QA workflow consume the immutable diff and fresh
   evidence in a different run. Its prompt states that it did not generate the
   change and requires assertion-strength review before coverage commentary.

This separation contrasts test generation with independent test review without
pretending that model judgment is deterministic.

## Optional shadow repository pattern

A shadow repository can isolate experimental issues, checks, or comments from a
primary repository, but it is **not configured here**. Adding one would require
a separate approval, a separately scoped credential, an explicit data-retention
decision, target allowlisting, and a reviewed threat model. Do not infer that
approval from approval to run this read-only workflow.

## Human decisions that remain open

- Whether to enable the workflow on the default branch and permit automatic PR
  triggers.
- Whether a specific manual dispatch should be approved.
- Whether seven-day retention is appropriate for the presentation calendar.
- Whether any future shadow-repository experiment is justified. It requires a
  separate approval and implementation review.
