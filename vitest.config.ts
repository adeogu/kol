import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
  test: {
    environment: "node",
    include: ["tests/web/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/web",
      reporter: ["text", "lcov", "json-summary"],
      all: true,
      include: [
        "app/api/messages/send/route.ts",
        "app/api/bookings/[id]/status/route.ts",
        "app/api/onboarding/select-role/route.ts",
        "app/api/poi/search/route.ts",
        "app/api/push/booking-created/route.ts",
        "app/api/push/subscribe/route.ts",
        "lib/poi.ts",
        "lib/push/server.ts",
      ],
      exclude: [],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
        perFile: true,
      },
    },
  },
});
