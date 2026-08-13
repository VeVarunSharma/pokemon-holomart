import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "unit",
    environment: "node",
    include: ["test/unit/**/*.test.js"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/unit",
      reporter: ["text", "json", "html", "lcov"],
      include: [
        "src/features/**/*.js",
        ".github/extensions/roadmap-studio/{model,renderer}.mjs",
        "scripts/{reset-demo,roadmap-to-issues}.mjs"
      ]
    }
  }
});
