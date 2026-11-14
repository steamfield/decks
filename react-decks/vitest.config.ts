import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["packages/{core,node}/src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
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
