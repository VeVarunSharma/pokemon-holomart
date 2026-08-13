import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { afterEach, expect, test } from "vitest";

const host = "127.0.0.1";
const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const serveScript = fileURLToPath(new URL("../../scripts/serve.mjs", import.meta.url));
const runningProcesses = new Set();

async function findAvailablePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, host, resolve);
  });
  const address = probe.address();
  const port = typeof address === "object" && address ? address.port : null;
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  if (!port || port === 4173) return findAvailablePort();
  return port;
}

function captureProcessOutput(child) {
  const output = { stdout: "", stderr: "", error: null };
  let didClose = false;
  let released = false;
  const closed = new Promise((resolve) => {
    child.once("close", (code, signal) => {
      didClose = true;
      resolve({ code, signal });
    });
  });
  const onStdoutData = (chunk) => {
    output.stdout += chunk;
  };
  const onStderrData = (chunk) => {
    output.stderr += chunk;
  };
  const onError = (error) => {
    output.error ??= error;
  };

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", onStdoutData);
  child.stderr.on("data", onStderrData);
  child.stdout.on("error", onError);
  child.stderr.on("error", onError);
  child.on("error", onError);

  return {
    child,
    output,
    closed,
    terminationPromise: null,
    get didClose() {
      return didClose;
    },
    release() {
      if (released) return;
      released = true;
      child.stdout.removeListener("data", onStdoutData);
      child.stderr.removeListener("data", onStderrData);
      child.stdout.removeListener("error", onError);
      child.stderr.removeListener("error", onError);
      child.removeListener("error", onError);
    }
  };
}

async function waitUntilResponsive(child, output, url) {
  const deadline = Date.now() + 10_000;
  let lastError;

  while (Date.now() < deadline) {
    if (output.error) throw output.error;
    if (child.exitCode !== null) {
      throw new Error(`serve.mjs exited before becoming responsive\n${output.stdout}${output.stderr}`);
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(750) });
      if (response.ok) return response;
      lastError = new Error(`Unexpected startup status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(50);
  }

  throw new Error(`serve.mjs did not become responsive: ${lastError?.message ?? "timed out"}\n${output.stdout}${output.stderr}`);
}

async function settlesWithin(promise, timeoutMs) {
  let timer;
  try {
    return await Promise.race([
      promise.then(() => true),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function destroyOutputHandles(captured) {
  for (const stream of [captured.child.stdout, captured.child.stderr]) {
    if (!stream.destroyed) stream.destroy();
  }
}

async function terminateCapturedProcess(captured) {
  const { child } = captured;
  try {
    if (!captured.didClose && child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
    }

    let closed = captured.didClose || await settlesWithin(captured.closed, 2_000);
    if (!closed) {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGKILL");
      }
      destroyOutputHandles(captured);
      closed = captured.didClose || await settlesWithin(captured.closed, 2_000);
    }

    if (!closed) {
      throw new Error(`Unable to terminate serve.mjs process ${child.pid}`);
    }
  } finally {
    destroyOutputHandles(captured);
    if (captured.didClose) captured.release();
  }
}

function terminateExactProcess(captured) {
  if (!captured.terminationPromise) {
    captured.terminationPromise = terminateCapturedProcess(captured).finally(() => {
      if (!captured.didClose) captured.terminationPromise = null;
    });
  }
  return captured.terminationPromise;
}

afterEach(async () => {
  const processes = [...runningProcesses];
  try {
    await Promise.all(processes.map(terminateExactProcess));
  } finally {
    for (const captured of processes) {
      if (captured.didClose) runningProcesses.delete(captured);
    }
  }
});

test("serves the demo assets without exposing traversal targets", { timeout: 15_000 }, async () => {
  const port = await findAvailablePort();
  const origin = `http://${host}:${port}`;
  const child = spawn(process.execPath, [serveScript], {
    cwd: repositoryRoot,
    env: { ...process.env, HOST: host, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  const captured = captureProcessOutput(child);
  runningProcesses.add(captured);

  try {
    const home = await waitUntilResponsive(child, captured.output, `${origin}/`);
    expect(home.status).toBe(200);
    expect(home.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(await home.text()).toContain("<title>HoloMart");

    const assets = [
      ["/app/app.js", "text/javascript; charset=utf-8", "initializeStorefront"],
      ["/app/styles.css", "text/css; charset=utf-8", "--primary"],
      ["/product/roadmap.json", "application/json; charset=utf-8", "SYNTHETIC / DEMO-ONLY"]
    ];
    for (const [pathname, contentType, expectedText] of assets) {
      const response = await fetch(`${origin}${pathname}`);
      expect(response.status, pathname).toBe(200);
      expect(response.headers.get("content-type"), pathname).toBe(contentType);
      expect(await response.text(), pathname).toContain(expectedText);
    }

    const missing = await fetch(`${origin}/missing-demo-asset.js`);
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe("Not found");

    for (const pathname of [
      "/%2e%2e%2fpackage.json",
      "/%2e%2e%5cpackage.json",
      "/%252e%252e%252fpackage.json"
    ]) {
      const response = await fetch(`${origin}${pathname}`);
      expect(response.status, pathname).toBe(404);
      expect(await response.text(), pathname).toBe("Not found");
    }
  } finally {
    await terminateExactProcess(captured);
    runningProcesses.delete(captured);
  }
});
