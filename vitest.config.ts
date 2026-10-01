import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Gives tests a fixture GDN_INTERNAL_API_KEY when none is set, so
    // the suite runs locally without a real secret.
    setupFiles: ["tests/setup-env.ts"],
  },
});
