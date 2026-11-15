import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*", "apps/*"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.{ts,tsx}", "apps/*/src/**/*.{ts,tsx}"],
      exclude: [
        "apps/server/src/main.ts",
        "apps/web/src/main.tsx",
        "apps/web/src/lane.tsx",
        "apps/web/src/lane-physics.ts",
        "apps/web/src/lane-models.ts",
        "apps/web/src/lane-scene.ts",
        "apps/web/src/lane-set.ts",
        "apps/web/src/lane-texture.ts",
        "apps/web/src/lane-glow.ts",
        "apps/web/src/lane-reflection.ts",
      ],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
        "packages/domain/src/**": {
          lines: 100,
          branches: 100,
          functions: 100,
          statements: 100,
        },
      },
    },
  },
});
