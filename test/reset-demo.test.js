import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const script = join(__dirname, "..", "scripts", "reset-demo.mjs");

function runReset(port) {
  const env = { ...process.env };
  if (port === undefined) {
    delete env.PORT;
  } else {
    env.PORT = port;
  }

  return spawnSync(process.execPath, [script], {
    env,
    encoding: "utf8"
  });
}

test("uses the default demo origin when PORT is unset", () => {
  const result = runReset(undefined);
  assert.equal(result.status, 0, result.stderr);
  const stdout = result.stdout.replace(/\r\n/g, "\n");
  assert.match(stdout, /At http:\/\/127\.0\.0\.1:4173, delete throwaway Saved Views/);
  assert.match(stdout, /navigate to http:\/\/127\.0\.0\.1:4173\/\./);
});

test("uses the alternate demo origin from PORT", () => {
  const result = runReset("4174");
  assert.equal(result.status, 0, result.stderr);
  const stdout = result.stdout.replace(/\r\n/g, "\n");
  assert.match(stdout, /At http:\/\/127\.0\.0\.1:4174, delete throwaway Saved Views/);
  assert.match(stdout, /navigate to http:\/\/127\.0\.0\.1:4174\/\./);
});

test("fails clearly for invalid PORT values", () => {
  const result = runReset("nope");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr.replace(/\r\n/g, "\n"), /Invalid PORT value "nope"/);
});
