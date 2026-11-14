import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          // Node tests start real Vite servers and builds. The first test in a file pays for
          // loading the compiler and highlighter, which took over five seconds on the slower
          // cluster hosts; the limit bounds a hang, it is not an assertion.
          testTimeout: 30_000,
          include: [
            "packages/{core,node,decks}/src/**/*.test.{ts,tsx}",
            "tests/**/*.test.{ts,tsx}",
          ],
        },
      },
      {
        test: {
          name: "dom",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["packages/{runtime,motion,kit}/src/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
