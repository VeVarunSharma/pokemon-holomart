---
name: HoloMart Agentic QA
description: Produce immutable deterministic QA evidence and a seeded independent review for the synthetic HoloMart web app.

on:
  stale-check: full
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    paths:
      - "app/**"
      - "src/**"
      - "test/**"
      - "scripts/**"
      - "package.json"
      - ".github/agents/qa-*.agent.md"
      - ".github/prompts/qa-*.prompt.md"
      - ".github/workflows/holomart-agentic-qa.md"
  workflow_dispatch:
    inputs:
      revision:
        description: Full 40-character commit SHA to test.
        required: true
        type: string
      base_revision:
        description: Full 40-character base SHA used to build the review diff.
        required: true
        type: string
      seed:
        description: Unsigned 32-bit exploration seed, or auto to derive it from revision.
        required: true
        default: auto
        type: string

permissions:
  contents: read
  pull-requests: read
  copilot-requests: write

strict: true
if: github.event_name == 'workflow_dispatch' || github.event.pull_request.draft == false

concurrency:
  group: holomart-agentic-qa-${{ github.event.pull_request.number || inputs.revision }}
  cancel-in-progress: true

checkout:
  ref: ${{ github.event.pull_request.head.sha || inputs.revision }}
  fetch-depth: 0

engine:
  id: copilot
  args:
    - "--deny-tool=write"

runtimes:
  node:
    version: "22"

env:
  QA_ARTIFACT_DIR: /tmp/gh-aw/agent/qa
  QA_BASE_URL: http://127.0.0.1:4173
  QA_HEAD_SHA: ${{ github.event.pull_request.head.sha || inputs.revision }}
  QA_BASE_SHA: ${{ github.event.pull_request.base.sha || inputs.base_revision }}
  QA_SEED_INPUT: ${{ inputs.seed || 'auto' }}
  QA_EVENT_NAME: ${{ github.event_name }}
  QA_REPOSITORY: ${{ github.repository }}
  QA_RUN_ID: ${{ github.run_id }}
  PLAYWRIGHT_CLI_SESSION: holomart-qa-${{ github.run_id }}
  PWTEST_CLI_GLOBAL_CONFIG: /tmp/gh-aw/agent/qa/playwright-cli.config.json

network:
  allowed:
    - defaults
    - node
    - playwright
    - local

tools:
  github: false
  edit: false
  bash:
    - "cat /tmp/gh-aw/agent/qa/manifest.json"
    - "cat /tmp/gh-aw/agent/qa/deterministic-results.json"
    - "cat /tmp/gh-aw/agent/qa/deterministic-report.md"
    - "cat /tmp/gh-aw/agent/qa/browser-results.json"
    - "cat /tmp/gh-aw/agent/qa/browser-report.md"
    - "cat /tmp/gh-aw/agent/qa/exploration-plan.json"
    - "cat /tmp/gh-aw/agent/qa/changed-files.txt"
    - "cat /tmp/gh-aw/agent/qa/changes.patch"
    - "playwright-cli open http://127.0.0.1:4173"
    - "playwright-cli snapshot"
    - "playwright-cli find *"
    - "playwright-cli click *"
    - "playwright-cli fill *"
    - "playwright-cli select *"
    - "playwright-cli press *"
    - "playwright-cli resize *"
    - "playwright-cli reload"
    - "playwright-cli console warning"
    - "playwright-cli requests"
    - "playwright-cli localstorage-clear"
    - "playwright-cli localstorage-set holomart.saved-searches.v1 *"
    - "playwright-cli screenshot --filename=/tmp/gh-aw/agent/qa/exploratory/explore-1.png --full-page"
    - "playwright-cli screenshot --filename=/tmp/gh-aw/agent/qa/exploratory/explore-2.png --full-page"
    - "playwright-cli screenshot --filename=/tmp/gh-aw/agent/qa/exploratory/explore-3.png --full-page"
    - "playwright-cli close"
  playwright:
    mode: cli
    version: "0.1.17"

safe-outputs:
  scripts:
    record-qa-verdict:
      description: "Record one structured QA verdict without network or repository writes"
      inputs:
        verdict:
          description: "One of pass, fail, or blocked"
          required: true
          type: string
        summary:
          description: "Concise evidence-grounded rationale"
          required: true
          type: string
        report:
          description: "Complete Markdown QA report with the required headings and replay evidence"
          required: true
          type: string
      script: |
        const allowed = new Set(["pass", "fail", "blocked"]);
        if (!allowed.has(item.verdict)) {
          throw new Error(`Unsupported QA verdict: ${item.verdict}`);
        }
        if (typeof item.summary !== "string" || typeof item.report !== "string") {
          throw new Error("QA verdict summary and report must be strings");
        }
        const summaryContentBytes = Buffer.byteLength(item.summary.trim(), "utf8");
        const summaryBytes = Buffer.byteLength(item.summary, "utf8");
        const reportContentBytes = Buffer.byteLength(item.report.trim(), "utf8");
        const reportBytes = Buffer.byteLength(item.report, "utf8");
        if (summaryContentBytes < 10 || summaryBytes > 2000) {
          throw new Error(`QA verdict summary must be 10-2000 UTF-8 bytes; received ${summaryBytes}`);
        }
        if (reportContentBytes < 200 || reportBytes > 50000) {
          throw new Error(`QA report must be 200-50000 UTF-8 bytes; received ${reportBytes}`);
        }
        core.info(`QA verdict: ${item.verdict} - ${item.summary}`);
        return { recorded: true, verdict: item.verdict };
  noop: false
  missing-tool: false
  missing-data: false
  report-incomplete: false
  threat-detection: false
  report-failure-as-issue: false
  report-failed-jobs: false
  activation-comments: false
  mentions: false
  allowed-github-references: []
  max-bot-mentions: 1

max-turns: 12
max-ai-credits: 750
max-daily-ai-credits: -1
timeout-minutes: 30

pre-agent-steps:
  - name: Install repository dependencies
    shell: bash
    run: npm ci

  - name: Provision the bounded browser runtime
    shell: bash
    continue-on-error: true
    run: |
      set -euo pipefail
      mkdir -p "$QA_ARTIFACT_DIR/logs"
      runtime="$RUNNER_TEMP/holomart-playwright-runtime"
      browsers="$RUNNER_TEMP/holomart-playwright-browsers"
      npm install \
        --prefix "$runtime" \
        --no-save \
        --ignore-scripts \
        --no-audit \
        --no-fund \
        playwright@1.51.1 \
        > "$QA_ARTIFACT_DIR/logs/playwright-runtime-install.log" 2>&1
      NODE_PATH="$runtime/node_modules" \
        PLAYWRIGHT_BROWSERS_PATH="$browsers" \
        node "$runtime/node_modules/playwright/cli.js" install --with-deps chromium \
        > "$QA_ARTIFACT_DIR/logs/playwright-browser-install.log" 2>&1
      echo "NODE_PATH=$runtime/node_modules" >> "$GITHUB_ENV"
      echo "PLAYWRIGHT_BROWSERS_PATH=$browsers" >> "$GITHUB_ENV"
      playwright-cli install-browser chromium > "$QA_ARTIFACT_DIR/logs/playwright-install.log" 2>&1

  - name: Prepare immutable QA context
    shell: bash
    continue-on-error: true
    run: node scripts/agentic-qa-evidence.mjs prepare

  - name: Run deterministic QA gates
    shell: bash
    continue-on-error: true
    run: node scripts/agentic-qa-evidence.mjs run

post-steps:
  - name: Close the known exploratory browser session
    if: always()
    continue-on-error: true
    shell: bash
    run: playwright-cli close

  - name: Finalize and validate QA evidence
    if: always()
    continue-on-error: true
    shell: bash
    run: node scripts/agentic-qa-evidence.mjs finalize

  - id: upload-qa-evidence
    name: Upload bounded QA evidence
    if: always()
    uses: actions/upload-artifact@v7
    with:
      name: holomart-agentic-qa-evidence
      path: /tmp/gh-aw/agent/qa/
      if-no-files-found: error
      retention-days: 7
      compression-level: 6

  - name: Enforce deterministic QA gates
    if: always()
    shell: bash
    run: node scripts/agentic-qa-evidence.mjs enforce

  - name: Remove staged QA bundle after bounded upload
    if: always() && steps.upload-qa-evidence.outcome == 'success'
    shell: bash
    run: node scripts/agentic-qa-evidence.mjs cleanup
---

# HoloMart independent QA review

Act as an independent QA reviewer for the **SYNTHETIC / DEMO-ONLY** HoloMart
web app. You did not generate this change and have no prior implementation-agent
conversation. Review only the immutable revision and fresh evidence captured in
this run.

## Evidence contract

1. Read `manifest.json`, `deterministic-results.json`,
   `deterministic-report.md`, `browser-results.json`, `browser-report.md`,
   `exploration-plan.json`, `changed-files.txt`, and `changes.patch` from
   `/tmp/gh-aw/agent/qa/`.
2. Confirm that every evidence file names `QA_HEAD_SHA`, the manifest names
   `QA_BASE_SHA`, and the seed matches the exploration plan. Missing, malformed,
   stale, or contradictory evidence is never a pass.
3. Treat the six deterministic gates and browser cases `QA-01` through `QA-07`
   as immutable observations. They alone determine the blocking conclusion.
   Never rerun them into a different status or let an AI observation override
   them.
4. Repository test-quality standards are defined at
   `.github/agents/qa-engineer.agent.md:67-75`. Preserve its deterministic,
   behavior-focused, isolated, readable, proportionate, maintainable, and
   honest boundaries.

## Independent assertion review

Review changed tests and their production paths from the bounded diff and
checkout. Do not infer that a test was AI-generated unless the pull request
explicitly supplies that provenance; call it a PR-added test otherwise.

For every changed or added test, report:

- the observable requirement it claims to protect;
- the production behavior actually reached;
- the assertion that would fail under a plausible behavior-breaking mutation;
- false-pass risk and missing negative, boundary, recovery, or state checks;
- verdict: strong, useful but incomplete, weak, vanity, or unverified.

Challenge assertions that only prove execution, element existence, mock calls,
snapshots without semantic checks, test count, or coverage percentage. Flag
tautologies, assertions that repeat production calculations, success-only
checks, and broad tests whose key failure can be masked by unrelated assertions.
Do not reward test volume or coverage alone.

## Seeded exploratory pass

Use exactly the three ordered charters in `exploration-plan.json`. The seed
fixes selection and replay order; it does not make model reasoning
deterministic.

1. Open only `http://127.0.0.1:4173`.
2. Clear browser local storage between charters unless the charter explicitly
   tests persistence.
3. Use Playwright CLI browser actions only. Do not use `run-code`, upload,
   PDF, video, tracing, saved browser state, external URLs, or live services.
4. Save one full-page screenshot after each charter using the exact allowed
   paths `exploratory/explore-1.png` through `exploratory/explore-3.png`.
5. Record the seed, charter ID, exact action sequence, observed state,
   screenshot path, and confidence. Reproduction evidence must be concrete;
   exploratory suspicion is not a confirmed defect.
6. Stop after the three selected charters. Do not expand scope.

## Final response

Use GitHub-flavored Markdown with:

### QA verdict

State the deterministic blocking result first. Keep the independent assertion
review and seeded exploratory result advisory.

### Deterministic evidence

Show all gates with command, status, and evidence path. Include every failed
assertion without softening it.

### Independent test-strength review

Compare PR-added tests with existing tests. Surface vanity tests and weak
assertions before coverage gaps.

### Seeded exploration

Show the seed and three replayable charters, actions, observations,
screenshots, counter-signals, and limitations.

### Residual risk

Separate confirmed defects, unverified risks, assumptions, and environment
limits. State that HoloMart uses repository-local synthetic fixtures and that
no real shopper, seller, inventory, payment, pricing, credential, token, or
copyrighted artwork was used.

Call `record_qa_verdict` exactly once with `pass`, `fail`, or `blocked`, a
concise evidence-grounded summary, and the complete Markdown report you will
return. The report must name the tested revision, seed, each selected charter
ID, and all three screenshot paths. Use `pass` only when deterministic evidence
passed and the independent review completed; advisory findings remain in the
report. Use `fail` when deterministic evidence failed. Use `blocked` when
required review or exploration evidence is unavailable. The handler records
structured run evidence only; it has no network or repository-write capability.
This workflow exposes no issue, pull-request, comment, check, code, or
shadow-repository output.
