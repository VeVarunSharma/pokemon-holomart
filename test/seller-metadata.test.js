import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../app/styles.css", import.meta.url), "utf8");

function rulesFor(selector) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selectors, declarations]) => ({
      selectors: selectors.split(",").map((value) => value.trim()),
      declarations
    }))
    .filter((rule) => rule.selectors.includes(selector));
}

function declarationValue(declarations, property) {
  return [...declarations.matchAll(new RegExp(`${property}:\\s*([^;]+)`, "g"))].at(-1)?.[1].trim();
}

function luminance(hex) {
  const channels = hex.match(/\w{2}/g).map((channel) => Number.parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

test("seller metadata uses the shared readable style without truncation", () => {
  const rules = rulesFor(".seller-row small");
  assert.equal(rules.length, 1);
  assert.deepEqual(rules[0].selectors, [".seller-row small"]);

  const { declarations } = rules[0];
  assert.equal(declarationValue(declarations, "font-size"), "0.75rem");
  assert.ok(Number(declarationValue(declarations, "line-height")) >= 1.4);
  assert.doesNotMatch(declarations, /(?:overflow|text-overflow|white-space):/);
});

test("seller metadata color meets WCAG AA contrast against cards", () => {
  const root = rulesFor(":root")[0].declarations;
  const metadata = rulesFor(".seller-row small").map((rule) => rule.declarations).join("\n");
  const colorVariable = declarationValue(metadata, "color").match(/var\((--[^)]+)\)/)[1];
  const foreground = declarationValue(root, colorVariable).slice(1);
  const background = declarationValue(root, "--surface").slice(1);
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const contrast =
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);

  assert.ok(contrast >= 4.5, `Expected at least 4.5:1 contrast, received ${contrast.toFixed(2)}:1`);
});
