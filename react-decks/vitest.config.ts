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
      {
        // An example deck's own checks against the kit. Data provenance tests that read other
        // repositories (building-for-agents/data) are run by hand, not in the gate.
        // Decks import the public package names, which resolve to source here.
        resolve: { conditions: ["@steamfield/decks/source"] },
        ssr: { resolve: { conditions: ["@steamfield/decks/source"] } },
        test: {
          name: "examples",
          environment: "node",
          setupFiles: ["./vitest.setup.ts"],
          testTimeout: 30_000,
          include: ["examples/*/styles/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
