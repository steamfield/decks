/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "happy-dom",
    // The player tests mount iframes whose pages don't exist here, so happy-dom
    // doesn't load them; tests/setup.ts drops the console error it logs for each.
    environmentOptions: { happyDOM: { settings: { disableIframePageLoading: true } } },
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    env: { PUBLIC_POSTHOG_KEY: "" },
    coverage: { provider: "v8", include: ["src/**/*.{ts,tsx}"] },
  },
});
