import { satteri, satteriHeadingIdsPlugin } from "@astrojs/markdown-satteri";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { site } from "./src/config.ts";
import { codeTitle, docsHastPlugins } from "./src/lib/markdown.ts";

// Self-hosted at build time from installed packages: no font request leaves the site.
// Two families: Inter (variable), the face the slides use, and JetBrains Mono for
// commands and the transcript. A family's file downloads only when a page draws a
// glyph in it. Only Inter is preloaded.
const local = (name, cssVariable, src, fallbacks, weight = "400") => ({
  provider: fontProviders.local(),
  name,
  cssVariable,
  fallbacks,
  options: { variants: [{ src: [src], weight, style: "normal" }] },
});

export default defineConfig({
  site: site.url,
  output: "static",
  // Directory output with trailing slashes: /docs/install/ is served from
  // docs/install/index.html, so canonicals, links and the sitemap agree as-is.
  trailingSlash: "always",
  build: { format: "directory" },
  fonts: [
    local(
      "Inter",
      "--ff-inter",
      "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
      ["sans-serif"],
      "100 900",
    ),
    local(
      "JetBrains Mono",
      "--ff-mono",
      "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
      ["monospace"],
    ),
  ],
  integrations: [
    react(),
    // Pages only: the error page and endpoints (.md, .txt, .png) stay out.
    sitemap({ filter: (page) => page.endsWith("/") && !page.includes("/404") }),
  ],
  markdown: {
    // Sätteri is Astro's default processor; heading ids come first so the
    // anchor plugin can read them.
    processor: satteri({ hastPlugins: [satteriHeadingIdsPlugin(), ...docsHastPlugins] }),
    shikiConfig: {
      themes: { light: "github-light-high-contrast", dark: "github-dark-default" },
      // Both themes as CSS variables; global.css picks one per theme.
      defaultColor: false,
      transformers: [codeTitle],
    },
  },
  vite: { plugins: [tailwind()] },
});
