#!/usr/bin/env node

function getPort(rawPort) {
  const port = Number.parseInt(rawPort ?? "4173", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value "${rawPort ?? ""}". Use a valid local port such as 4173 or 4174.`);
  }
  return port;
}

try {
  const port = getPort(process.env.PORT);
  const origin = `http://127.0.0.1:${port}`;

  console.log(`HoloMart safe reset checklist

No files, Git state, browser data, or remote resources were changed.

1. At ${origin}, delete throwaway Saved Searches with each × control.
2. Choose Clear, then navigate to ${origin}/.
3. For malformed state only, remove this one key in browser DevTools:
   holomart.saved-searches.v1
4. Close and reopen Roadmap Studio to reset its in-memory focus/filter state.
5. Restart the known npm server with Ctrl+C then "npm start", if needed.
6. Run "npm run demo:check".

Never use git reset, checkout, restore, or clean for a demo reset.
See docs/demo-operations.md for detailed and fallback instructions.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
