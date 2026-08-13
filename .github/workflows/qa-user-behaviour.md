---
name: QA User Behaviour

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read
  pull-requests: read
  copilot-requests: write

strict: true

engine:
  id: copilot
  args:
    - "--deny-tool=write"

runtimes:
  node:
    version: "22"

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
    - "cat /tmp/gh-aw/agent/qa/results.json"
    - "cat /tmp/gh-aw/agent/qa/report.md"
    - "playwright-cli open *"
    - "playwright-cli goto *"
    - "playwright-cli snapshot"
    - "playwright-cli click *"
    - "playwright-cli fill *"
    - "playwright-cli select *"
    - "playwright-cli press *"
    - "playwright-cli run-code *"
    - "playwright-cli screenshot *"
    - "playwright-cli resize *"
    - "playwright-cli close"
  playwright:
    mode: cli
    version: "0.1.17"

safe-outputs:
  add-comment:
    max: 1
    hide-older-comments: false

timeout-minutes: 30

pre-agent-steps:
  - name: Provision pinned Playwright and start HoloMart
    shell: bash
    run: |
      set -euo pipefail
      mkdir -p /tmp/gh-aw/agent/qa/screenshots
      runtime="$RUNNER_TEMP/qa-user-behaviour-playwright"
      browsers="$RUNNER_TEMP/qa-user-behaviour-browsers"
      npm install \
        --prefix "$runtime" \
        --no-save \
        --ignore-scripts \
        --no-audit \
        --no-fund \
        playwright@1.51.1
      NODE_PATH="$runtime/node_modules" \
        PLAYWRIGHT_BROWSERS_PATH="$browsers" \
        node "$runtime/node_modules/playwright/cli.js" install --with-deps chromium
      echo "NODE_PATH=$runtime/node_modules" >> "$GITHUB_ENV"
      echo "PLAYWRIGHT_BROWSERS_PATH=$browsers" >> "$GITHUB_ENV"
      playwright-cli install-browser chromium
      node scripts/serve.mjs > /tmp/gh-aw/agent/qa/server.log 2>&1 &
      echo "$!" > /tmp/gh-aw/agent/qa/server.pid

      for attempt in $(seq 1 30); do
        if curl --fail --silent --show-error http://127.0.0.1:4173/ > /dev/null; then
          exit 0
        fi
        sleep 1
      done

      cat /tmp/gh-aw/agent/qa/server.log
      exit 1

  - name: Run fixed user-behaviour acceptance suite
    shell: bash
    continue-on-error: true
    run: |
      set -euo pipefail
      cat > /tmp/gh-aw/agent/qa/run-acceptance.cjs <<'NODE'
      const fs = require("node:fs");
      const path = require("node:path");
      const { chromium } = require("playwright");

      const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:4173";
      const qaDir = process.env.QA_DIR || "/tmp/gh-aw/agent/qa";
      const screenshotsDir = path.join(qaDir, "screenshots");
      const specs = [
        {
          id: "QA-01",
          title: "Storefront boot and catalog trust context",
          expected: "The HoloMart home page, hero heading, non-empty catalog, count, and sampled listing trust fields render."
        },
        {
          id: "QA-02",
          title: "Search, facets, URL state, and reset",
          expected: "Pikachu plus known rarity and expansion yields one listing and encoded URL state; Clear restores the catalog."
        },
        {
          id: "QA-03",
          title: "Zero-result recovery",
          expected: "A guaranteed no-match query shows recovery UI; Clear filters restores normal results."
        },
        {
          id: "QA-04",
          title: "Device-local Saved Search lifecycle",
          expected: "Blank names cannot save; QA Pikachu saves locally, survives reload, applies, and deletes with boundary copy intact."
        },
        {
          id: "QA-05",
          title: "Demo cart feedback",
          expected: "Adding one visible card updates count, accessible cart name, add feedback, and demo cart summary."
        },
        {
          id: "QA-06",
          title: "Filtered CSV export",
          expected: "A one-result filtered catalog downloads the deterministic CSV header and exactly one data row."
        },
        {
          id: "QA-07",
          title: "Keyboard and narrow viewport",
          expected: "Ctrl+K and Save Search focus work; recovery and mobile Save controls are discoverable; 320px has no page overflow."
        }
      ];

      fs.mkdirSync(screenshotsDir, { recursive: true });

      function ensure(condition, message) {
        if (!condition) throw new Error(message);
      }

      function cleanError(error) {
        const message = error instanceof Error ? error.message : String(error);
        return message.replace(/\s+/g, " ").trim().slice(0, 1200);
      }

      function escapeTable(value) {
        return String(value).replaceAll("|", "\\|").replace(/\r?\n/g, " ");
      }

      function writeOutputs(results, infrastructureError = "") {
        const passed = results.filter((result) => result.status === "PASS").length;
        const failed = results.filter((result) => result.status === "FAIL").length;
        const errors = results.filter((result) => result.status === "ERROR").length;
        const payload = {
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          provenance: "SYNTHETIC / DEMO-ONLY",
          baseUrl,
          infrastructureError,
          summary: {
            total: specs.length,
            passed,
            failed,
            errors,
            conclusion: passed === specs.length ? "success" : "failure"
          },
          cases: results
        };

        fs.writeFileSync(path.join(qaDir, "results.json"), `${JSON.stringify(payload, null, 2)}\n`);

        const lines = [
          "# QA User Behaviour",
          "",
          "**SYNTHETIC / DEMO-ONLY** - local HoloMart fixture data only.",
          "",
          `Fixed result: **${passed === specs.length ? "PASS" : "FAIL"}** (${passed}/${specs.length} passed)`,
          ""
        ];
        if (infrastructureError) {
          lines.push(`Infrastructure error: ${infrastructureError}`, "");
        }
        lines.push(
          "| Case | Result | Expected | Observed | Evidence |",
          "| --- | --- | --- | --- | --- |"
        );
        for (const result of results) {
          lines.push(`| ${result.id} | ${result.status} | ${escapeTable(result.expected)} | ${escapeTable(result.observed)} | ${escapeTable(result.evidence)} |`);
        }
        fs.writeFileSync(path.join(qaDir, "report.md"), `${lines.join("\n")}\n`);
      }

      async function run() {
        const results = [];
        const browser = await chromium.launch({ headless: true });

        async function runCase(spec, test) {
          const startedAt = Date.now();
          const context = await browser.newContext({
            acceptDownloads: true,
            viewport: { width: 1280, height: 900 }
          });
          const page = await context.newPage();
          page.setDefaultTimeout(10000);
          page.on("console", (message) => {
            fs.appendFileSync(path.join(qaDir, "browser-console.log"), `[${spec.id}] ${message.type()}: ${message.text()}\n`);
          });

          try {
            const observed = await test(page);
            results.push({
              id: spec.id,
              title: spec.title,
              status: "PASS",
              expected: spec.expected,
              observed,
              evidence: "Deterministic Playwright assertions completed.",
              durationMs: Date.now() - startedAt
            });
          } catch (error) {
            const screenshot = path.join(screenshotsDir, `${spec.id}.png`);
            try {
              await page.screenshot({ path: screenshot, fullPage: true });
            } catch {
              // The page can be unavailable during an infrastructure failure.
            }
            results.push({
              id: spec.id,
              title: spec.title,
              status: "FAIL",
              expected: spec.expected,
              observed: cleanError(error),
              evidence: fs.existsSync(screenshot) ? `screenshots/${spec.id}.png` : "No screenshot available.",
              durationMs: Date.now() - startedAt
            });
          } finally {
            await context.close();
          }
        }

        await runCase(specs[0], async (page) => {
          const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
          ensure(response && response.ok(), `Expected HTTP success, observed ${response?.status() ?? "no response"}.`);
          await page.locator(".product-card").first().waitFor({ state: "visible" });

          ensure(await page.getByRole("link", { name: "HoloMart home" }).first().isVisible(), "HoloMart home link is not visible.");
          ensure(
            (await page.getByRole("heading", { level: 1 }).innerText()).trim() === "Find the card your binder is missing.",
            "Hero heading does not match the product contract."
          );

          const cards = page.locator(".product-card");
          const cardCount = await cards.count();
          const reportedCount = Number.parseInt(await page.locator("#result-count").innerText(), 10);
          ensure(cardCount > 0, "Catalog rendered no cards.");
          ensure(cardCount === reportedCount, `Rendered ${cardCount} cards but summary reports ${reportedCount}.`);

          for (let index = 0; index < Math.min(cardCount, 3); index += 1) {
            const card = cards.nth(index);
            const tags = await card.locator(".tag-row span").allInnerTexts();
            ensure((await card.locator("h3").innerText()).trim().length > 0, `Sample ${index + 1} has no card name.`);
            ensure(/^\$[\d,]+\.\d{2}$/.test((await card.locator(".price-row strong").innerText()).trim()), `Sample ${index + 1} has no formatted price.`);
            ensure(/market/i.test(await card.locator(".price-row small").innerText()), `Sample ${index + 1} has no market comparison.`);
            ensure(tags.length >= 2 && tags[1].trim().length > 0, `Sample ${index + 1} has no condition.`);
            ensure((await card.locator(".seller-row strong").innerText()).trim().length > 0, `Sample ${index + 1} has no seller.`);
            ensure(/^\d+ left$/.test((await card.locator(".seller-row em").innerText()).trim()), `Sample ${index + 1} has no stock count.`);
          }

          return `HTTP ${response.status()}; ${cardCount} rendered listings match the summary; 3 sampled cards expose trust fields.`;
        });

        await runCase(specs[1], async (page) => {
          await page.goto(baseUrl, { waitUntil: "networkidle" });
          await page.locator("#query").fill("Pikachu");
          await page.locator("#rarity").selectOption("Special Illustration Rare");
          await page.locator("#expansion").selectOption("Surging Sparks");

          ensure((await page.locator("#result-count").innerText()).trim() === "1", "Known Pikachu filters did not produce exactly one listing.");
          ensure((await page.locator(".product-card h3").innerText()).trim() === "Pikachu ex", "Filtered listing is not Pikachu ex.");

          const filteredUrl = new URL(page.url());
          ensure(filteredUrl.searchParams.get("q") === "Pikachu", "URL is missing q=Pikachu.");
          ensure(filteredUrl.searchParams.get("rarity") === "Special Illustration Rare", "URL is missing the selected rarity.");
          ensure(filteredUrl.searchParams.get("expansion") === "Surging Sparks", "URL is missing the selected expansion.");

          await page.locator("#clear-button").click();
          const restoredCount = Number.parseInt(await page.locator("#result-count").innerText(), 10);
          ensure(restoredCount > 1, "Clear did not restore the full catalog.");
          ensure(new URL(page.url()).search === "", "Clear did not remove filter URL state.");
          return "One Pikachu ex listing and exact URL parameters observed; Clear restored the full catalog and clean URL.";
        });

        await runCase(specs[2], async (page) => {
          await page.goto(baseUrl, { waitUntil: "networkidle" });
          await page.locator("#query").fill("qa-guaranteed-no-match-9f4c");

          ensure((await page.locator("#result-count").innerText()).trim() === "0", "No-match query did not produce zero results.");
          ensure(await page.locator("#empty-state").isVisible(), "Zero-result recovery panel is not visible.");
          ensure(!(await page.locator("#card-grid").isVisible()), "Catalog remains visible in the zero-result state.");

          const recovery = page.getByRole("button", { name: "Clear filters" });
          ensure(await recovery.isVisible(), "Clear filters recovery control is not visible.");
          await recovery.click();

          const restoredCount = Number.parseInt(await page.locator("#result-count").innerText(), 10);
          ensure(restoredCount > 0, "Clear filters did not restore catalog results.");
          ensure(!(await page.locator("#empty-state").isVisible()), "Empty state remains visible after recovery.");
          return `Zero-result UI appeared and Clear filters restored ${restoredCount} listings.`;
        });

        await runCase(specs[3], async (page) => {
          await page.goto(baseUrl, { waitUntil: "networkidle" });
          await page.locator("#query").fill("Pikachu");
          await page.locator("#save-search-button").click();
          await page.waitForFunction(() => document.activeElement?.id === "search-name");

          const name = page.locator("#search-name");
          await page.getByRole("button", { name: "Save search", exact: true }).click();
          ensure(await page.locator("#save-search-dialog").isVisible(), "Blank search name unexpectedly closed the dialog.");
          ensure(!(await name.evaluate((input) => input.validity.valid)), "Blank required search name was accepted.");

          ensure(
            (await page.locator(".dialog-disclaimer").innerText()).includes("Account sync and price alerts are not available yet."),
            "Saved Search boundary copy is missing."
          );
          ensure(
            (await page.locator(".local-note").innerText()).includes("Stored on this device only"),
            "Device-local storage copy is missing."
          );

          await name.fill("QA Pikachu");
          await page.getByRole("button", { name: "Save search", exact: true }).click();
          ensure(await page.getByRole("button", { name: /^QA Pikachu/ }).isVisible(), "Saved search was not rendered.");

          await page.reload({ waitUntil: "networkidle" });
          const saved = page.getByRole("button", { name: /^QA Pikachu/ });
          ensure(await saved.isVisible(), "Saved search did not survive reload.");
          await saved.click();
          ensure(await page.locator("#query").inputValue() === "Pikachu", "Saved search did not reapply its query.");
          ensure((await page.locator("#result-count").innerText()).trim() === "1", "Applied saved search did not restore one result.");

          await page.getByRole("button", { name: "Delete QA Pikachu" }).click();
          ensure(await page.getByRole("button", { name: /^QA Pikachu/ }).count() === 0, "Saved search remained after deletion.");
          ensure(await page.getByText("Save your first search").isVisible(), "Empty Saved Searches state did not return.");
          return "Required-name validation, exact boundary copy, reload persistence, apply, and delete all succeeded.";
        });

        await runCase(specs[4], async (page) => {
          await page.goto(baseUrl, { waitUntil: "networkidle" });
          const firstCard = page.locator(".product-card").first();
          const name = (await firstCard.locator("h3").innerText()).trim();
          await firstCard.locator("[data-add-id]").click();

          ensure((await page.locator("#cart-count").innerText()).trim() === "1", "Cart count did not increment to 1.");
          ensure(await page.locator("#cart-button").getAttribute("aria-label") === "Open cart, 1 item", "Accessible cart label did not update.");
          ensure((await page.locator("#toast").innerText()).trim() === `${name} added to your demo cart`, "Add-to-cart confirmation is incorrect.");

          await page.locator("#cart-button").click();
          ensure((await page.locator("#toast").innerText()).trim() === "Your demo cart has 1 card", "Demo cart summary is incorrect.");
          return `${name} added; visible and accessible counts are 1; demo summary confirmed.`;
        });

        await runCase(specs[5], async (page) => {
          await page.goto(baseUrl, { waitUntil: "networkidle" });
          await page.locator("#query").fill("Pikachu");
          await page.locator("#rarity").selectOption("Special Illustration Rare");
          await page.locator("#expansion").selectOption("Surging Sparks");
          ensure((await page.locator("#result-count").innerText()).trim() === "1", "CSV setup did not produce one result.");

          const downloadPromise = page.waitForEvent("download");
          await page.locator("#export-button").click();
          const download = await downloadPromise;
          const csvPath = path.join(qaDir, "filtered-catalog.csv");
          await download.saveAs(csvPath);

          const rows = fs.readFileSync(csvPath, "utf8").split(/\r?\n/);
          ensure(rows.length === 2, `Expected header plus one row, observed ${rows.length} rows.`);
          ensure(rows[0] === "ID,Card,Expansion,Number,Rarity,Condition,Price,Market price,Seller,Stock", "CSV header is not deterministic.");
          ensure(
            rows[1] === "SV08-238,Pikachu ex,Surging Sparks,238/191,Special Illustration Rare,Near Mint,329,341.28,Mossdeep Cards,1",
            "CSV data row does not match the synthetic Pikachu fixture."
          );
          return "Downloaded CSV contains the deterministic 10-column header and one exact Pikachu ex data row.";
        });

        await runCase(specs[6], async (page) => {
          await page.goto(baseUrl, { waitUntil: "networkidle" });
          await page.keyboard.press("Control+K");
          ensure(await page.locator("#query").evaluate((input) => document.activeElement === input), "Ctrl+K did not focus Search cards.");

          await page.locator("#query").fill("qa-guaranteed-no-match-9f4c");
          ensure(await page.getByRole("button", { name: "Clear filters" }).isVisible(), "Clear filters is not discoverable in the recovery state.");
          await page.getByRole("button", { name: "Clear filters" }).click();

          await page.locator("#save-search-button").click();
          await page.waitForFunction(() => document.activeElement?.id === "search-name");
          ensure(await page.locator("#search-name").evaluate((input) => document.activeElement === input), "Save Search did not focus Search name.");
          await page.getByRole("button", { name: "Close save search dialog" }).click();

          await page.setViewportSize({ width: 320, height: 800 });
          ensure(await page.getByRole("button", { name: "Save current search" }).isVisible(), "Mobile Save current search control is not visible at 320px.");
          ensure(await page.getByRole("search").isVisible(), "Filter search region is not discoverable at 320px.");
          const dimensions = await page.evaluate(() => ({
            clientWidth: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth
          }));
          ensure(dimensions.scrollWidth <= dimensions.clientWidth + 1, `Document overflows horizontally: ${dimensions.scrollWidth}px > ${dimensions.clientWidth}px.`);
          return "Keyboard focus assertions passed; recovery and mobile Save controls are role-discoverable; 320px has no document overflow.";
        });

        await browser.close();
        writeOutputs(results);
      }

      run().catch((error) => {
        const infrastructureError = cleanError(error);
        const results = specs.map((spec) => ({
          id: spec.id,
          title: spec.title,
          status: "ERROR",
          expected: spec.expected,
          observed: infrastructureError,
          evidence: "Acceptance runner infrastructure failure.",
          durationMs: 0
        }));
        writeOutputs(results, infrastructureError);
      });
      NODE

      node /tmp/gh-aw/agent/qa/run-acceptance.cjs

  - name: Upload fixed QA evidence
    if: always()
    uses: actions/upload-artifact@v7
    with:
      name: qa-user-behaviour-evidence
      path: /tmp/gh-aw/agent/qa/
      if-no-files-found: warn
      retention-days: 7

post-steps:
  - name: Stop HoloMart server
    if: always()
    shell: bash
    run: |
      if [ ! -f /tmp/gh-aw/agent/qa/server.pid ]; then
        exit 0
      fi
      server_pid="$(cat /tmp/gh-aw/agent/qa/server.pid)"
      if [[ "$server_pid" =~ ^[0-9]+$ ]]; then
        kill "$server_pid" 2>/dev/null || true
      fi

jobs:
  qa_check_conclusion:
    name: Publish fixed QA gate
    needs: [agent]
    if: always() && github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    permissions:
      actions: read
      checks: write
      contents: read
    steps:
      - name: Download fixed QA evidence
        continue-on-error: true
        uses: actions/download-artifact@v8
        with:
          name: qa-user-behaviour-evidence
          path: /tmp/gh-aw/qa-evidence

      - name: Publish QA User Behaviour check
        uses: actions/github-script@v9
        env:
          AGENT_RESULT: ${{ needs.agent.result }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
          RESULTS_PATH: /tmp/gh-aw/qa-evidence/results.json
        with:
          script: |
            const fs = require("node:fs");
            const expectedIds = ["QA-01", "QA-02", "QA-03", "QA-04", "QA-05", "QA-06", "QA-07"];
            const validStatuses = new Set(["PASS", "FAIL", "ERROR"]);
            let validationError = "";
            let cases = [];

            try {
              const payload = JSON.parse(fs.readFileSync(process.env.RESULTS_PATH, "utf8"));
              if (payload.schemaVersion !== 1 || !Array.isArray(payload.cases)) {
                throw new Error("results.json has an unsupported schema");
              }
              const receivedIds = payload.cases.map((item) => item.id);
              const exactIds = receivedIds.length === expectedIds.length
                && expectedIds.every((id) => receivedIds.filter((candidate) => candidate === id).length === 1)
                && receivedIds.every((id) => expectedIds.includes(id));
              if (!exactIds) throw new Error("results.json must contain exactly QA-01 through QA-07 once each");

              cases = expectedIds.map((id) => {
                const item = payload.cases.find((candidate) => candidate.id === id);
                if (!validStatuses.has(item.status)) {
                  throw new Error(`${id} has invalid status ${item.status}`);
                }
                for (const field of ["title", "expected", "observed", "evidence"]) {
                  if (typeof item[field] !== "string" || item[field].trim() === "") {
                    throw new Error(`${id} is missing ${field}`);
                  }
                }
                return item;
              });
            } catch (error) {
              validationError = error instanceof Error ? error.message : String(error);
              cases = expectedIds.map((id) => ({
                id,
                title: "Evidence unavailable",
                status: "ERROR",
                expected: "A complete deterministic result.",
                observed: validationError,
                evidence: "qa-user-behaviour-evidence artifact"
              }));
            }

            const allPassed = validationError === "" && cases.every((item) => item.status === "PASS");
            const passed = cases.filter((item) => item.status === "PASS").length;
            const conclusion = allPassed ? "success" : "failure";
            const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            const rows = cases.map((item) =>
              `| ${item.id} | ${item.status} | ${String(item.observed).replaceAll("|", "\\|").replace(/\r?\n/g, " ")} |`
            );
            const text = [
              "**SYNTHETIC / DEMO-ONLY** - local HoloMart fixture data only.",
              "",
              `Agent job: \`${process.env.AGENT_RESULT}\``,
              validationError ? `Evidence validation error: ${validationError}` : "",
              "",
              "| Case | Result | Observed |",
              "| --- | --- | --- |",
              ...rows,
              "",
              `[Workflow run and evidence artifact](${runUrl})`
            ].filter(Boolean).join("\n");

            await github.rest.checks.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              name: "QA User Behaviour",
              head_sha: process.env.HEAD_SHA,
              status: "completed",
              conclusion,
              details_url: runUrl,
              external_id: String(context.runId),
              output: {
                title: allPassed ? "All fixed user journeys passed" : "Fixed user journey gate failed",
                summary: `${passed}/${expectedIds.length} fixed cases passed. The check fails closed when evidence is missing, malformed, incomplete, or non-passing.`,
                text
              }
            });

            if (!allPassed) {
              core.setFailed(`${passed}/${expectedIds.length} fixed QA cases passed`);
            }
---

# HoloMart end-to-end QA

Act as a QA analyst for the **SYNTHETIC / DEMO-ONLY** HoloMart web app. The fixed
acceptance suite has already run with conventional Playwright code. It is the
only source of the merge-gating conclusion.

## Required procedure

1. Read `/tmp/gh-aw/agent/qa/results.json` and `/tmp/gh-aw/agent/qa/report.md`.
2. Treat exactly `QA-01` through `QA-07` as fixed cases. Do not change, omit,
   rerun into a different status, or reinterpret their deterministic results.
3. When a fixed case is `FAIL` or `ERROR`, use the current Playwright CLI
   commands (`open`, `goto`, `snapshot`, `click`, `fill`, `select`, `press`,
   `run-code`, `screenshot`, `resize`, and `close`) only as needed to clarify
   the reproduction. The app is already running at `http://127.0.0.1:4173`.
4. You may inspect clipping, confusing copy, focus behavior, and trust-signal
   consistency as exploratory observations. Clearly label these advisory;
   they cannot alter the fixed result.
5. Add exactly one pull-request comment through the `safeoutputs` CLI. Include:
   - `**SYNTHETIC / DEMO-ONLY**`;
   - the fixed pass count and overall fixed result;
   - a table for QA-01 through QA-07;
   - for each failure, the exact failed assertion, expected behavior, observed
     behavior, evidence path, and concise reproduction steps;
   - an `Exploratory observations (advisory)` section;
   - the artifact name `qa-user-behaviour-evidence`.

If the fixed result files are missing or malformed, report an infrastructure
error and do not describe the run as passing. Do not modify repository files,
application data, workflow results, issues, pull requests, or checks.

## Fixed case contract

| ID | Journey | Must pass |
| --- | --- | --- |
| QA-01 | Storefront boot and catalog trust context | HTTP success; visible HoloMart home link and H1 `Find the card your binder is missing.`; non-zero listing count agrees with rendered cards; sampled cards expose name, price, market comparison, condition, seller, and stock. |
| QA-02 | Search, facets, URL state, and reset | `Pikachu` + `Special Illustration Rare` + `Surging Sparks` yields exactly `Pikachu ex`; URL state is encoded; Clear restores the full catalog and clean URL. |
| QA-03 | Zero-result recovery | A guaranteed no-match query shows the empty-state message and hides the catalog; `Clear filters` restores normal results. |
| QA-04 | Device-local Saved Search lifecycle | A blank name cannot save; `QA Pikachu` saves, survives reload, applies, and deletes; the dialog says `Account sync and price alerts are not available yet.` |
| QA-05 | Demo cart feedback | Adding a visible card updates count `1`, accessible cart label, add confirmation, and demo cart summary. |
| QA-06 | Filtered CSV export | A one-result catalog downloads the deterministic header and exactly one synthetic Pikachu row. |
| QA-07 | Keyboard and narrow viewport | Ctrl+K focuses Search cards; Save Search focuses Search name; zero-result `Clear filters` and 320px `Save current search` are role-discoverable; no document-level horizontal overflow at 320 CSS px. |
