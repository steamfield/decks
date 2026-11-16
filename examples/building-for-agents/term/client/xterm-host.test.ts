import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { type Browser, chromium, expect } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";
import { onTestFinished, test } from "vitest";

async function openTerminal() {
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
    `<!doctype html><div id="root" style="width:827px;height:355px"></div>
    <script type="module">
      import { createElement } from "react";
      import { createRoot } from "react-dom/client";
      import { XtermHost } from "/@fs${join(import.meta.dirname, "xterm-host.tsx")}";
      import { createConnection } from "/@fs${join(import.meta.dirname, "connection.ts")}";
      const handlers = new Map();
      const transport = {
        on(event, receive) { handlers.set(event, receive); },
        off(event) { handlers.delete(event); }, send() {},
      };
      window.receive = (event, data) => handlers.get(event)?.(data);
      const connection = createConnection(transport, {id:"test",rows:24,cols:92,cwd:"temp",commands:[]});
      connection.navigate(true, 0);
      createRoot(document.getElementById("root")).render(createElement(XtermHost, {
        connection, rows:24, cols:92, scale:1, fontFamily:"monospace", fontSize:24, colors:{},
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

test("a terminal refits when its display pixel ratio changes without a CSS resize", async () => {
  const { page, terminal } = await openTerminal();
  // Complete a resize before moving displays, so no initial ResizeObserver callback can mask the bug.
  await page.evaluate(`document.getElementById("root").style.width = "900px"`);
  await expect
    .poll(() => terminal.evaluate((element) => element.querySelector(".xterm-screen")?.clientWidth))
    .toBe(900);
  await page.evaluate(`document.getElementById("root").style.width = "827px"`);
  await expect
    .poll(() => terminal.evaluate((element) => element.querySelector(".xterm-screen")?.clientWidth))
    .toBe(827);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    mobile: false,
  });
  // CDP changes the ratio without sending the display's window event.
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await page.evaluate(
    `window.receive("deck-term:ready", {id:"test",buffer:"pixel-ratio-sentinel"})`,
  );
  await expect(terminal.getByText("pixel-ratio-sentinel", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      terminal.evaluate((element) => {
        const screen = element.querySelector(".xterm-screen");
        if (!(screen instanceof HTMLElement)) throw new Error("Missing rendered terminal screen");
        return {
          host: element.clientWidth,
          grid: screen.clientWidth,
          ratio: window.devicePixelRatio,
        };
      }),
    )
    .toEqual({ host: 827, grid: 827, ratio: 2 });
});

test("a new session clears old output that was still queued for rendering", async () => {
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
