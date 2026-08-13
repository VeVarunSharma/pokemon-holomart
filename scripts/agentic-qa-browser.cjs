#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const PROVENANCE = "SYNTHETIC / DEMO-ONLY";
const qaDir = path.resolve(process.env.QA_ARTIFACT_DIR || "/tmp/gh-aw/agent/qa");
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:4173";
const testedRevision = String(process.env.QA_HEAD_SHA || "").toLowerCase();
const manifestPath = path.join(qaDir, "manifest.json");
let seed = null;
const browserDir = path.join(qaDir, "browser");
const screenshotsDir = path.join(browserDir, "screenshots");
const consoleLog = path.join(qaDir, "logs", "browser-console.log");

const specs = [
  {
    id: "QA-01",
    title: "Storefront boot and catalog trust context",
    expected: "The loopback storefront renders a non-empty catalog whose count agrees with visible cards and whose sampled listings expose trust fields."
  },
  {
    id: "QA-02",
    title: "Search, facets, URL state, and reset",
    expected: "Known Pikachu filters yield exactly one matching listing and URL state; Clear restores the full catalog and clean URL."
  },
  {
    id: "QA-03",
    title: "Zero-result recovery",
    expected: "A guaranteed no-match query shows recovery UI and hides the catalog; Clear filters restores normal results."
  },
  {
    id: "QA-04",
    title: "Device-local Saved Search lifecycle",
    expected: "Blank names cannot save; a synthetic search saves locally, survives reload, applies, and deletes with boundary copy intact."
  },
  {
    id: "QA-05",
    title: "Demo cart feedback",
    expected: "Adding one visible listing updates visible and accessible counts plus synthetic demo-cart feedback."
  },
  {
    id: "QA-06",
    title: "Filtered CSV export",
    expected: "A one-result catalog downloads the deterministic CSV header and exact synthetic Pikachu fixture row."
  },
  {
    id: "QA-07",
    title: "Keyboard and narrow viewport",
    expected: "Ctrl+K and Save Search focus work; recovery and mobile Save controls remain discoverable; 320px has no document overflow."
  }
];

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function cleanError(error) {
  return (error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1600);
}

function escapeTable(value) {
  return String(value).replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function validateInputs() {
  ensure(/^[0-9a-f]{40}$/.test(testedRevision), "QA_HEAD_SHA must be a full commit SHA");
  const url = new URL(baseUrl);
  ensure(url.protocol === "http:", "QA_BASE_URL must use http");
  ensure(["127.0.0.1", "localhost"].includes(url.hostname), "QA_BASE_URL must remain on loopback");
}

function resolveSeed() {
  const candidate = process.env.QA_RESOLVED_SEED
    || JSON.parse(fs.readFileSync(manifestPath, "utf8")).seed;
  const resolved = Number(candidate);
  ensure(
    Number.isInteger(resolved) && resolved >= 0 && resolved <= 0xffffffff,
    "QA seed must be an unsigned 32-bit integer"
  );
  return resolved >>> 0;
}

function writeOutputs(results, infrastructureError = "") {
  const passed = results.filter((result) => result.status === "PASS").length;
  const failed = results.filter((result) => result.status === "FAIL").length;
  const errors = results.filter((result) => result.status === "ERROR").length;
  const conclusion = passed === specs.length ? "PASS" : "FAIL";
  const payload = {
    schemaVersion: 1,
    provenance: PROVENANCE,
    generatedAt: new Date().toISOString(),
    testedRevision,
    seed,
    baseUrl,
    infrastructureError,
    summary: {
      total: specs.length,
      passed,
      failed,
      errors,
      conclusion
    },
    cases: results
  };
  fs.writeFileSync(path.join(qaDir, "browser-results.json"), `${JSON.stringify(payload, null, 2)}\n`);

  const lines = [
    "# HoloMart deterministic browser evidence",
    "",
    `**${PROVENANCE}** - loopback storefront and repository fixtures only.`,
    "",
    `Tested revision: \`${testedRevision}\``,
    `Seed carried into the evidence bundle: \`${seed}\``,
    `Browser result: **${conclusion}** (${passed}/${specs.length} cases passed)`,
    ""
  ];
  if (infrastructureError) lines.push(`Infrastructure error: ${infrastructureError}`, "");
  lines.push(
    "| Case | Result | Expected | Observed | Evidence |",
    "| --- | --- | --- | --- | --- |"
  );
  for (const result of results) {
    lines.push(
      `| ${result.id} | ${result.status} | ${escapeTable(result.expected)} | ${escapeTable(result.observed)} | \`${result.evidence}\` |`
    );
  }
  fs.writeFileSync(path.join(qaDir, "browser-report.md"), `${lines.join("\n")}\n`);
}

async function run() {
  validateInputs();
  seed = resolveSeed();
  const { chromium } = require("playwright");
  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.mkdirSync(path.dirname(consoleLog), { recursive: true });
  const results = [];
  const browser = await chromium.launch({ headless: true });

  async function runCase(spec, execute) {
    const started = Date.now();
    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1280, height: 900 }
    });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    const screenshotRelative = `browser/screenshots/${spec.id}.png`;
    const screenshotPath = path.join(qaDir, ...screenshotRelative.split("/"));
    page.setDefaultTimeout(10000);
    page.on("console", (message) => {
      fs.appendFileSync(consoleLog, `[${spec.id}] ${message.type()}: ${message.text()}\n`);
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => {
      pageErrors.push(cleanError(error));
      fs.appendFileSync(consoleLog, `[${spec.id}] pageerror: ${cleanError(error)}\n`);
    });

    let status = "PASS";
    let observed = "";
    try {
      observed = await execute(page);
      ensure(pageErrors.length === 0, `Uncaught page errors: ${pageErrors.join("; ")}`);
      ensure(consoleErrors.length === 0, `Browser console errors: ${consoleErrors.join("; ")}`);
    } catch (error) {
      status = "FAIL";
      observed = cleanError(error);
    }

    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    } catch (error) {
      if (status === "PASS") {
        status = "ERROR";
        observed = `Browser assertions passed but screenshot capture failed: ${cleanError(error)}`;
      }
    }

    results.push({
      id: spec.id,
      title: spec.title,
      status,
      expected: spec.expected,
      observed,
      evidence: fs.existsSync(screenshotPath) ? screenshotRelative : "Screenshot unavailable",
      durationMs: Date.now() - started
    });
    await context.close();
  }

  try {
    await runCase(specs[0], async (page) => {
      const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
      ensure(response && response.ok(), `Expected HTTP success, observed ${response?.status() ?? "no response"}`);
      await page.locator(".product-card").first().waitFor({ state: "visible" });
      ensure(
        (await page.getByRole("heading", { level: 1 }).innerText()).trim() === "Find the card your binder is missing.",
        "Hero heading does not match the storefront contract"
      );

      const cards = page.locator(".product-card");
      const cardCount = await cards.count();
      const reportedCount = Number.parseInt(await page.locator("#result-count").innerText(), 10);
      ensure(cardCount > 0, "Catalog rendered no cards");
      ensure(cardCount === reportedCount, `Rendered ${cardCount} cards but summary reports ${reportedCount}`);

      for (let index = 0; index < Math.min(cardCount, 3); index += 1) {
        const card = cards.nth(index);
        const tags = await card.locator(".tag-row span").allInnerTexts();
        ensure((await card.locator("h3").innerText()).trim().length > 0, `Sample ${index + 1} has no card name`);
        ensure(/^\$[\d,]+\.\d{2}$/.test((await card.locator(".price-row strong").innerText()).trim()), `Sample ${index + 1} has no formatted price`);
        ensure(/market/i.test(await card.locator(".price-row small").innerText()), `Sample ${index + 1} has no market comparison`);
        ensure(tags.length >= 2 && tags[1].trim().length > 0, `Sample ${index + 1} has no condition`);
        ensure((await card.locator(".seller-row strong").innerText()).trim().length > 0, `Sample ${index + 1} has no seller`);
        ensure(/^\d+ left$/.test((await card.locator(".seller-row em").innerText()).trim()), `Sample ${index + 1} has no stock count`);
      }
      return `HTTP ${response.status()}; ${cardCount} cards match the summary; 3 sampled listings expose price, market, condition, seller, and stock.`;
    });

    await runCase(specs[1], async (page) => {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.locator("#query").fill("Pikachu");
      await page.locator("#rarity").selectOption("Special Illustration Rare");
      await page.locator("#expansion").selectOption("Surging Sparks");
      ensure((await page.locator("#result-count").innerText()).trim() === "1", "Known filters did not produce exactly one listing");
      ensure((await page.locator(".product-card h3").innerText()).trim() === "Pikachu ex", "Filtered listing is not Pikachu ex");

      const filteredUrl = new URL(page.url());
      ensure(filteredUrl.searchParams.get("q") === "Pikachu", "URL is missing q=Pikachu");
      ensure(filteredUrl.searchParams.get("rarity") === "Special Illustration Rare", "URL is missing the selected rarity");
      ensure(filteredUrl.searchParams.get("expansion") === "Surging Sparks", "URL is missing the selected expansion");

      await page.locator("#clear-button").click();
      const restoredCount = Number.parseInt(await page.locator("#result-count").innerText(), 10);
      ensure(restoredCount > 1, "Clear did not restore the catalog");
      ensure(new URL(page.url()).search === "", "Clear did not remove filter URL state");
      return "One Pikachu ex listing and exact URL parameters observed; Clear restored the catalog and clean URL.";
    });

    await runCase(specs[2], async (page) => {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.locator("#query").fill("qa-guaranteed-no-match-9f4c");
      ensure((await page.locator("#result-count").innerText()).trim() === "0", "No-match query did not produce zero results");
      ensure(await page.locator("#empty-state").isVisible(), "Zero-result recovery panel is not visible");
      ensure(!(await page.locator("#card-grid").isVisible()), "Catalog remains visible in the zero-result state");

      const recovery = page.getByRole("button", { name: "Clear filters" });
      ensure(await recovery.isVisible(), "Clear filters recovery control is not visible");
      await recovery.click();
      const restoredCount = Number.parseInt(await page.locator("#result-count").innerText(), 10);
      ensure(restoredCount > 0, "Clear filters did not restore catalog results");
      ensure(!(await page.locator("#empty-state").isVisible()), "Empty state remains visible after recovery");
      return `Zero-result UI appeared and Clear filters restored ${restoredCount} listings.`;
    });

    await runCase(specs[3], async (page) => {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.locator("#query").fill("Pikachu");
      await page.locator("#save-search-button").click();
      await page.waitForFunction(() => document.activeElement?.id === "search-name");

      const name = page.locator("#search-name");
      await page.getByRole("button", { name: "Save search", exact: true }).click();
      ensure(await page.locator("#save-search-dialog").isVisible(), "Blank name unexpectedly closed the dialog");
      ensure(!(await name.evaluate((input) => input.validity.valid)), "Blank required name was accepted");
      ensure(
        (await page.locator(".dialog-disclaimer").innerText()).includes("Account sync and price alerts are not available yet."),
        "Saved Search boundary copy is missing"
      );
      ensure(
        (await page.locator(".local-note").innerText()).includes("Stored on this device only"),
        "Device-local storage copy is missing"
      );

      await name.fill("QA Pikachu");
      await page.getByRole("button", { name: "Save search", exact: true }).click();
      ensure(await page.getByRole("button", { name: /^QA Pikachu/ }).isVisible(), "Saved search was not rendered");
      await page.reload({ waitUntil: "networkidle" });
      const saved = page.getByRole("button", { name: /^QA Pikachu/ });
      ensure(await saved.isVisible(), "Saved search did not survive reload");
      await saved.click();
      ensure(await page.locator("#query").inputValue() === "Pikachu", "Saved search did not reapply its query");
      ensure((await page.locator("#result-count").innerText()).trim() === "1", "Applied search did not restore one result");
      await page.getByRole("button", { name: "Delete QA Pikachu" }).click();
      ensure(await page.getByRole("button", { name: /^QA Pikachu/ }).count() === 0, "Saved search remained after deletion");
      ensure(await page.getByText("Save your first search").isVisible(), "Empty Saved Searches state did not return");
      return "Required-name validation, boundary copy, reload persistence, apply, and delete all succeeded.";
    });

    await runCase(specs[4], async (page) => {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      const firstCard = page.locator(".product-card").first();
      const name = (await firstCard.locator("h3").innerText()).trim();
      await firstCard.locator("[data-add-id]").click();
      ensure((await page.locator("#cart-count").innerText()).trim() === "1", "Cart count did not increment to 1");
      ensure(await page.locator("#cart-button").getAttribute("aria-label") === "Open cart, 1 item", "Accessible cart label did not update");
      ensure((await page.locator("#toast").innerText()).trim() === `${name} added to your demo cart`, "Add-to-cart confirmation is incorrect");
      await page.locator("#cart-button").click();
      ensure((await page.locator("#toast").innerText()).trim() === "Your demo cart has 1 card", "Demo cart summary is incorrect");
      return `${name} added; visible and accessible counts are 1; demo summary confirmed.`;
    });

    await runCase(specs[5], async (page) => {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.locator("#query").fill("Pikachu");
      await page.locator("#rarity").selectOption("Special Illustration Rare");
      await page.locator("#expansion").selectOption("Surging Sparks");
      ensure((await page.locator("#result-count").innerText()).trim() === "1", "CSV setup did not produce one result");

      const downloadPromise = page.waitForEvent("download");
      await page.locator("#export-button").click();
      const download = await downloadPromise;
      const csvPath = path.join(browserDir, "filtered-catalog.csv");
      await download.saveAs(csvPath);
      const rows = fs.readFileSync(csvPath, "utf8").split(/\r?\n/);
      ensure(rows.length === 2, `Expected header plus one row, observed ${rows.length} rows`);
      ensure(rows[0] === "ID,Card,Expansion,Number,Rarity,Condition,Price,Market price,Seller,Stock", "CSV header is not deterministic");
      ensure(
        rows[1] === "SV08-238,Pikachu ex,Surging Sparks,238/191,Special Illustration Rare,Near Mint,329,341.28,Mossdeep Cards,1",
        "CSV row does not match the synthetic Pikachu fixture"
      );
      return "Downloaded CSV contains the deterministic 10-column header and one exact synthetic Pikachu row.";
    });

    await runCase(specs[6], async (page) => {
      await page.goto(baseUrl, { waitUntil: "networkidle" });
      await page.keyboard.press("Control+K");
      ensure(await page.locator("#query").evaluate((input) => document.activeElement === input), "Ctrl+K did not focus Search cards");
      await page.locator("#query").fill("qa-guaranteed-no-match-9f4c");
      ensure(await page.getByRole("button", { name: "Clear filters" }).isVisible(), "Clear filters is not discoverable");
      await page.getByRole("button", { name: "Clear filters" }).click();
      await page.locator("#save-search-button").click();
      await page.waitForFunction(() => document.activeElement?.id === "search-name");
      ensure(await page.locator("#search-name").evaluate((input) => document.activeElement === input), "Save Search did not focus Search name");
      await page.getByRole("button", { name: "Close save search dialog" }).click();

      await page.setViewportSize({ width: 320, height: 800 });
      ensure(await page.getByRole("button", { name: "Save current search" }).isVisible(), "Mobile Save current search is not visible at 320px");
      ensure(await page.getByRole("search").isVisible(), "Filter search region is not discoverable at 320px");
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth
      }));
      ensure(dimensions.scrollWidth <= dimensions.clientWidth + 1, `Document overflows horizontally: ${dimensions.scrollWidth}px > ${dimensions.clientWidth}px`);
      return "Keyboard focus assertions passed; recovery and mobile controls are discoverable; 320px has no document overflow.";
    });
  } finally {
    await browser.close();
  }

  writeOutputs(results);
  process.exitCode = results.every(({ status }) => status === "PASS") ? 0 : 1;
}

run().catch((error) => {
  const infrastructureError = cleanError(error);
  fs.mkdirSync(qaDir, { recursive: true });
  const results = specs.map((spec) => ({
    id: spec.id,
    title: spec.title,
    status: "ERROR",
    expected: spec.expected,
    observed: infrastructureError,
    evidence: "Browser acceptance infrastructure failure",
    durationMs: 0
  }));
  writeOutputs(results, infrastructureError);
  console.error(infrastructureError);
  process.exitCode = 1;
});
