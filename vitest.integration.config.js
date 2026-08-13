import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "integration",
    environment: "node",
    include: ["test/integration/**/*.test.js"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/integration",
      reporter: ["text", "json", "html", "lcov"],
      include: [
        "src/storefront/**/*.js",
        ".github/extensions/roadmap-studio/{model,renderer}.mjs",
        "scripts/{reset-demo,roadmap-to-issues,serve}.mjs"
      ]
    }
  }
});
