import path from "node:path";

export const PROVENANCE_LABEL = "SYNTHETIC / DEMO-ONLY";

export const TEST_DEFINITIONS = Object.freeze({
  "test/csv.test.js": {
    title: "CSV export tests",
    category: "unit",
  },
  "test/filter-state.test.js": {
    title: "Filter state tests",
    category: "unit",
  },
  "test/qa-change-risk.test.js": {
    title: "QA Change-Risk extension tests",
    category: "integration",
  },
  "test/reset-demo.test.js": {
    title: "Demo reset tests",
    category: "integration",
  },
  "test/roadmap-studio.test.js": {
    title: "Roadmap Studio tests",
    category: "integration",
  },
  "test/roadmap-to-issues.test.js": {
    title: "Roadmap issue preview tests",
    category: "integration",
  },
  "test/saved-searches.test.js": {
    title: "Saved Searches tests",
    category: "unit",
  },
  "test/share-state.test.js": {
    title: "Share-state tests",
    category: "unit",
  },
});

export const CAPABILITY_RULES = Object.freeze([
  {
    id: "storefront",
    label: "Storefront experience",
    journey: "Search, compare, and interact with synthetic card listings",
    prefixes: ["app/"],
    tags: ["runtime", "ui"],
    impact: "medium",
    tests: [
      "test/filter-state.test.js",
      "test/saved-searches.test.js",
      "test/share-state.test.js",
      "test/csv.test.js",
    ],
    manual: [
      {
        id: "keyboard-reflow",
        title: "Keyboard, focus, and responsive reflow",
        category: "accessibility",
        rationale: "User-facing markup, styles, and event wiring require browser-level review that unit tests do not provide.",
      },
      {
        id: "critical-journey",
        title: "Critical storefront journey",
        category: "exploratory",
        rationale: "Exercise search, filtering, Saved Searches, export, and demo-cart behavior together.",
      },
    ],
  },
  {
    id: "catalog-data",
    label: "Synthetic catalog data",
    journey: "Browse and filter the demo catalog",
    prefixes: ["src/data/"],
    tags: ["runtime", "data"],
    impact: "medium",
    tests: ["test/filter-state.test.js", "test/csv.test.js"],
    manual: [],
  },
  {
    id: "filters",
    label: "Catalog filtering",
    journey: "Search and narrow listings by query, rarity, and expansion",
    prefixes: ["src/features/filters/"],
    tags: ["runtime", "state"],
    impact: "medium",
    tests: ["test/filter-state.test.js", "test/share-state.test.js"],
    manual: [],
  },
  {
    id: "saved-searches",
    label: "Device-local Saved Searches",
    journey: "Save, apply, and remove a search in the current browser",
    prefixes: ["src/features/saved-searches/"],
    tags: ["runtime", "state", "persistence"],
    impact: "high",
    tests: ["test/saved-searches.test.js", "test/filter-state.test.js"],
    manual: [
      {
        id: "local-recovery",
        title: "Saved Search recovery and storage failure",
        category: "exploratory",
        rationale: "Confirm visible recovery for malformed or unavailable browser-local storage.",
      },
    ],
  },
  {
    id: "share-state",
    label: "Shareable filter state",
    journey: "Share and restore catalog filters through a URL",
    prefixes: ["src/features/share/"],
    tags: ["runtime", "state"],
    impact: "medium",
    tests: ["test/share-state.test.js", "test/filter-state.test.js"],
    manual: [],
  },
  {
    id: "catalog-export",
    label: "Catalog CSV export",
    journey: "Export the current synthetic catalog selection",
    prefixes: ["src/features/export/"],
    tags: ["runtime", "data"],
    impact: "medium",
    tests: ["test/csv.test.js"],
    manual: [],
  },
  {
    id: "qa-canvas",
    label: "QA Change-Risk canvas",
    journey: "Review local change risk and explicitly run safe tests",
    prefixes: [".github/extensions/qa-change-risk/"],
    tags: ["workflow", "ui", "state"],
    impact: "high",
    tests: ["test/qa-change-risk.test.js"],
    manual: [
      {
        id: "canvas-keyboard",
        title: "Canvas keyboard and narrow-width review",
        category: "accessibility",
        rationale: "Verify tab semantics, focus visibility, live updates, and reflow in the rendered canvas.",
      },
    ],
  },
  {
    id: "roadmap-workflow",
    label: "Roadmap and issue-preview workflow",
    journey: "Review the authoritative demo roadmap and preview delivery work",
    prefixes: [
      ".github/extensions/roadmap-studio/",
      ".github/extensions/roadmap-view/",
      "scripts/roadmap-to-issues.mjs",
      "product/roadmap.json",
      "product/roadmap.schema.json",
    ],
    tags: ["workflow", "artifact"],
    impact: "high",
    tests: ["test/roadmap-studio.test.js", "test/roadmap-to-issues.test.js"],
    manual: [],
  },
  {
    id: "demo-operations",
    label: "Demo operations",
    journey: "Start, validate, and reset the local HoloMart demonstration",
    prefixes: ["scripts/serve.mjs", "scripts/reset-demo.mjs"],
    tags: ["workflow"],
    impact: "medium",
    tests: ["test/reset-demo.test.js"],
    manual: [],
  },
  {
    id: "product-artifacts",
    label: "Product, design, and workflow artifacts",
    journey: "Use evidence-disciplined local product and design guidance",
    prefixes: ["product/", "design/", "docs/", ".github/prompts/", ".github/agents/", ".github/skills/"],
    tags: ["artifact", "workflow"],
    impact: "medium",
    tests: [],
    manual: [
      {
        id: "artifact-links",
        title: "Artifact provenance and link review",
        category: "exploratory",
        rationale: "Confirm claims remain cited, synthetic provenance remains visible, and local links resolve.",
      },
    ],
  },
  {
    id: "repository-validation",
    label: "Repository validation",
    journey: "Validate required demo artifacts and workflow safety boundaries",
    prefixes: ["scripts/validate-artifacts.mjs", "package.json"],
    tags: ["workflow", "artifact"],
    impact: "high",
    tests: [],
    manual: [],
  },
  {
    id: "tests",
    label: "Automated test coverage",
    journey: "Detect regressions in repository behavior",
    prefixes: ["test/"],
    tags: ["test"],
    impact: "medium",
    tests: [],
    manual: [],
  },
]);

const SAFE_TARGETS = new Set(Object.keys(TEST_DEFINITIONS));

export function normalizeRepoPath(value) {
  return String(value ?? "").replaceAll("\\", "/").replace(/^\.\/+/, "");
}

export function rulesForPath(filePath) {
  const normalized = normalizeRepoPath(filePath);
  return CAPABILITY_RULES.filter((rule) =>
    rule.prefixes.some((prefix) => {
      const candidate = normalizeRepoPath(prefix);
      return candidate.endsWith("/") ? normalized.startsWith(candidate) : normalized === candidate;
    }));
}

export function safeCommandFor(recommendation, platform = process.platform) {
  if (recommendation.commandId === "npm-test") {
    return {
      executable: platform === "win32" ? "npm.cmd" : "npm",
      args: ["test"],
      display: "npm test",
    };
  }
  if (recommendation.commandId === "npm-validate") {
    return {
      executable: platform === "win32" ? "npm.cmd" : "npm",
      args: ["run", "validate"],
      display: "npm run validate",
    };
  }
  if (recommendation.commandId === "targeted-node-test") {
    const testPath = normalizeRepoPath(recommendation.testPath);
    if (!SAFE_TARGETS.has(testPath)) {
      throw new Error(`Test path is not allowlisted: ${testPath || "<empty>"}`);
    }
    return {
      executable: process.execPath,
      args: ["--test", path.normalize(testPath)],
      display: `node --test ${JSON.stringify(testPath)}`,
    };
  }
  throw new Error(`Command is not allowlisted: ${recommendation.commandId || "<empty>"}`);
}

export function isAllowlistedTestPath(testPath) {
  return SAFE_TARGETS.has(normalizeRepoPath(testPath));
}
