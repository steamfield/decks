// @vitest-environment jsdom
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { type Browser, chromium, expect } from "@playwright/test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer, type ViteDevServer } from "vite";
import { onTestFinished, test } from "vitest";
import type { LiveDemo } from "../../components/LiveDemoStage";

// These start a browser and a dev server, which the unit run should not carry. Run by hand:
// DECKS_LIVE_TERM=1 bun run test examples/building-for-agents/term/client/xterm-host.test.ts
const browserTest = test.skipIf(process.env.DECKS_LIVE_TERM !== "1");

async function openTerminal(scale = 1) {
  const root = resolve(import.meta.dirname, "../../../..");
  const scratch = resolve(import.meta.dirname, "../../.tmp");
  await mkdir(scratch, { recursive: true });
  const dir = await mkdtemp(join(scratch, "term-host-"));
  let server: ViteDevServer | undefined;
  let browser: Browser | undefined;
  onTestFinished(async () => {
    await browser?.close();
    await server?.close();
    await rm(dir, { recursive: true, force: true });
  });
  await writeFile(
    join(dir, "index.html"),
    `<!doctype html><div id="root" style="width:827px;height:355px;transform:scale(${scale});transform-origin:top left"></div>
    <script type="module">
      import { createElement } from "react";
      import { createRoot } from "react-dom/client";
      import "@fontsource/vt323";
      import { XtermHost } from "/@fs${join(import.meta.dirname, "xterm-host.tsx")}";
      import { createConnection } from "/@fs${join(import.meta.dirname, "connection.ts")}";
      const handlers = new Map();
      const transport = {
        on(event, receive) { handlers.set(event, receive); },
        off(event) { handlers.delete(event); }, send() {},
      };
      window.receive = (event, data) => handlers.get(event)?.(data);
      const connection = createConnection(transport, {id:"test",rows:8,cols:40,cwd:"temp",commands:[]});
      connection.navigate(true, 0);
      await document.fonts.load('24px "VT323"');
      createRoot(document.getElementById("root")).render(createElement(XtermHost, {
        connection, rows:8, cols:40, scale:${scale}, fontFamily:"VT323", fontSize:24, colors:{},
      }));
    </script>`,
  );
  server = await createServer({
    configFile: false,
    root: dir,
    cacheDir: join(dir, ".vite"),
    logLevel: "silent",
    server: { host: "127.0.0.1", port: 0, fs: { allow: [root] } },
    optimizeDeps: {
      entries: [join(dir, "index.html")],
      include: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/client",
        "@xterm/xterm",
      ],
    },
  });
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error("Missing terminal test URL");
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  onTestFinished(() => expect(errors).toEqual([]));
  await page.goto(url);
  const terminal = page.getByRole("application", { name: "Live terminal" });
  await expect(terminal.getByRole("textbox", { name: "Terminal input" })).toBeAttached();
  await page.evaluate(`window.receive("deck-term:ready", {id:"test",buffer:"initial-prompt"})`);
  await expect(terminal.getByText("initial-prompt", { exact: true })).toBeVisible();
  return { page, terminal };
}

browserTest.each([1, 0.75])(
  "a terminal preserves readable type at frame scale %s",
  async (scale) => {
    const { terminal } = await openTerminal(scale);
    await expect
      .poll(() =>
        terminal.evaluate((element) => {
          const rows = element.querySelector(".xterm-rows");
          if (!(rows instanceof HTMLElement)) throw new Error("Missing rendered terminal rows");
          const row = rows.firstElementChild;
          if (!(row instanceof HTMLElement)) throw new Error("Missing rendered terminal row");
          const css = getComputedStyle(rows);
          const screen = element.querySelector(".xterm-screen");
          const metrics = document.createElement("canvas").getContext("2d");
          if (!(screen instanceof HTMLElement) || !metrics)
            throw new Error("Missing terminal font measurements");
          metrics.font = `${css.fontSize} ${css.fontFamily}`;
          return {
            face: css.fontFamily,
            size: css.fontSize,
            extraSpacing: screen.clientWidth - Math.round(metrics.measureText("W").width * 40),
            rows: rows.childElementCount,
            rowHeight: row.clientHeight,
          };
        }),
      )
      .toEqual({
        face: "VT323",
        size: `${24 * scale}px`,
        extraSpacing: 0,
        rows: 8,
        rowHeight: Math.floor(24 * scale * 1.12),
      });
  },
);

test.each([
  { rows: 12, cols: 92 },
  { rows: 11, cols: 145 },
])(
  "a pane with $rows rows and $cols columns reports the largest readable grid",
  async ({ rows, cols }) => {
    await import("../../setup");
    const { LiveDemoStage } = await import("../../components/LiveDemoStage");
    const demo: LiveDemo = {
      headline: "Commands run in a shell.",
      product: "stacks",
      copy: [],
      panes: [
        {
          pane: { id: "oversize", rows, cols, cwd: "temp", commands: [] },
          label: "SHELL",
          recording: { kind: "lines", lines: [], shownAt: [0], tag: "Recorded" },
        },
      ],
    };
    expect(() => renderToString(createElement(LiveDemoStage, { demo }))).toThrow(
      'Pane "oversize" exceeds the largest readable grid: 11 rows by 144 columns at 28px.',
    );
  },
);

browserTest("a new session clears old output that was still queued for rendering", async () => {
  const { page, terminal } = await openTerminal();
  await page.evaluate(`
    window.receive("deck-term:data", {id:"test",chunk:"old-output\\r\\n".repeat(20000) + "old-marker\\r\\n"});
    window.receive("deck-term:ready", {id:"test",buffer:"fresh-prompt\\r\\n"});
    window.receive("deck-term:data", {id:"test",chunk:"fresh-sentinel"});
  `);
  await expect(terminal.getByText("fresh-sentinel", { exact: true })).toBeVisible();
  await expect(terminal.getByText("fresh-prompt", { exact: true })).toBeVisible();
  await expect(terminal.getByText("old-marker", { exact: true })).toHaveCount(0);
  await expect(terminal.getByText("old-output", { exact: true })).toHaveCount(0);
});
