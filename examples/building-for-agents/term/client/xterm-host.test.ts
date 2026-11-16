// @vitest-environment jsdom
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { type Browser, chromium, expect } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";
import { onTestFinished, test } from "vitest";

// These start a browser and a dev server, which the unit run should not carry. Run by hand:
// DECKS_LIVE_TERM=1 bun run test examples/building-for-agents/term/client/xterm-host.test.ts
const browserTest = test.skipIf(process.env.DECKS_LIVE_TERM !== "1");

async function openTerminal(
  scale = 1,
  deviceScaleFactor = 1,
  grid = { rows: 8, cols: 40, width: 425, height: 260, size: 24 },
) {
  const root = resolve(import.meta.dirname, "../../../..");
  const scratch = join(root, ".tmp");
  await mkdir(scratch, { recursive: true });
  const dir = await mkdtemp(join(scratch, "term-host-"));
  await symlink(
    resolve(import.meta.dirname, "../../node_modules"),
    join(dir, "node_modules"),
    "dir",
  );
  let server: ViteDevServer | undefined;
  let browser: Browser | undefined;
  onTestFinished(async () => {
    await browser?.close();
    await server?.close();
    await rm(dir, { recursive: true, force: true });
  });
  await writeFile(
    join(dir, "index.html"),
    `<!doctype html><div class="od-stage-overlay"><div id="skin"><div id="frame" style="padding:20px"><div>SHELL LABEL</div><div id="root" style="width:${grid.width}px;height:${grid.height}px;transform:scale(${scale});transform-origin:top left"></div><div style="display:flex;justify-content:space-between"><span>CAPTION BAND</span><span>Live tag</span></div></div></div></div>
    <script type="module">
      import { createElement } from "react";
      import { createRoot } from "react-dom/client";
      import { flushSync } from "react-dom";
      import "@fontsource/vt323";
      import "@steamfield/decks/kit/styles.css";
      import skin from "/@fs${join(import.meta.dirname, "../../components/LiveTerm.module.css")}";
      import { XtermHost } from "/@fs${join(import.meta.dirname, "xterm-host.tsx")}";
      import { createConnection } from "/@fs${join(import.meta.dirname, "connection.ts")}";
      const handlers = new Map();
      window.sent = [];
      const transport = {
        on(event, receive) { handlers.set(event, receive); },
        off(event) { handlers.delete(event); }, send(event, data) { window.sent.push({ event, data }); },
      };
      window.receive = (event, data) => handlers.get(event)?.(data);
      const connection = createConnection(transport, {id:"test",rows:8,cols:40,cwd:"temp",commands:[]});
      document.getElementById("skin").className = skin.skin;
      connection.navigate(true, 0);
      await document.fonts.load('24px "VT323"');
      const root = createRoot(document.getElementById("root"));
      let key = 0;
      const render = () => root.render(createElement(XtermHost, {
        key, connection, rows:${grid.rows}, cols:${grid.cols}, scale:${scale}, fontFamily:"VT323", fontSize:${grid.size}, colors:{}, wheelTarget:document.getElementById("frame"),
      }));
      window.remountHost = () => { key++; flushSync(render); };
      render();
    </script>`,
  );
  server = await createServer({
    configFile: false,
    resolve: { conditions: ["@steamfield/decks/source"] },
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
  const page = await browser.newPage({
    viewport: {
      width: grid.cols === 135 ? (scale === 0.75 ? 1440 : 1920) : 1024,
      height: grid.cols === 135 ? (scale === 0.75 ? 900 : 1080) : 768,
    },
    deviceScaleFactor,
  });
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
        size: scale === 1 ? "25px" : "17.5px",
        extraSpacing: 0,
        rows: 8,
        rowHeight: scale === 1 ? 28 : 19,
      });
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

browserTest(
  "a terminal remounted with a pending write replays output without a browser error",
  async () => {
    const { page, terminal } = await openTerminal();
    await page.evaluate(`
    window.receive("deck-term:data", {id:"test",chunk:"\\r\\nnew-output"});
    window.remountHost();
  `);
    await expect(terminal.getByText("new-output", { exact: true })).toBeVisible();
  },
);

browserTest(
  "replayed device queries never reach the shell, and live queries still receive replies",
  async () => {
    const { page, terminal } = await openTerminal();
    await page.evaluate(
      `window.receive("deck-term:ready", {id:"test",buffer:"\\u001b]11;?\\u0007\\u001b[6nreplayed-sentinel"})`,
    );
    await expect(terminal.getByText("replayed-sentinel", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(`window.sent.filter(message => message.event === "deck-term:input")`),
    ).toEqual([]);
    await page.evaluate(
      `window.receive("deck-term:data", {id:"test",chunk:"\\r\\n\\u001b]11;?\\u0007live-sentinel"})`,
    );
    await expect(terminal.getByText("live-sentinel", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(`window.sent.filter(message => message.event === "deck-term:input")`),
    ).toEqual([
      {
        event: "deck-term:input",
        data: { id: "test", data: "\u001b]11;rgb:0000/0000/0000\u001b\\" },
      },
    ]);
  },
);

browserTest.each([1, 0.75])(
  "the frame scrolls over text, its label and its band at scale %s",
  async (scale) => {
    const { page, terminal } = await openTerminal(scale);
    await page.evaluate(
      `window.receive("deck-term:ready", {id:"test",buffer:Array.from({length:60},(_,i)=>"row-"+i).join("\\r\\n")})`,
    );
    await expect(terminal.getByText("row-59", { exact: true })).toBeVisible();
    for (const area of [terminal, page.getByText("SHELL LABEL"), page.getByText("CAPTION BAND")]) {
      await area.hover();
      await page.mouse.wheel(0, -5000);
      await expect(terminal.getByText("row-0", { exact: true })).toBeVisible();
      await page.mouse.wheel(0, 5000);
      await expect(terminal.getByText("row-59", { exact: true })).toBeVisible();
    }
    const box = await terminal.boundingBox();
    if (!box) throw new Error("Missing terminal frame");
    await page.mouse.move(box.x - 10, box.y + box.height / 2);
    await page.mouse.wheel(0, -5000);
    await expect(terminal.getByText("row-0", { exact: true })).toBeVisible();
    const caption = await page.getByText("CAPTION BAND").boundingBox();
    const tag = await page.getByText("Live tag").boundingBox();
    if (!caption || !tag) throw new Error("Missing terminal band");
    await page.mouse.move((caption.x + caption.width + tag.x) / 2, caption.y + caption.height / 2);
    await page.mouse.wheel(0, 5000);
    await expect(terminal.getByText("row-59", { exact: true })).toBeVisible();
    await terminal.click();
    await page.getByText("CAPTION BAND").hover();
    await page.mouse.wheel(0, -5000);
    await expect(terminal.getByText("row-0", { exact: true })).toBeVisible();
    await page.evaluate(`window.receive("deck-term:data", {id:"test",chunk:"\\r\\nnew-output"})`);
    await expect(terminal.getByText("new-output", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(terminal.getByRole("textbox", { name: "Terminal input" })).not.toBeFocused();
  },
);

browserTest.each([
  { scale: 0.94, dpr: 1 },
  { scale: 0.75, dpr: 1 },
  { scale: 0.94, dpr: 2 },
  { scale: 0.75, dpr: 2 },
])("the last column fits its cell at scale $scale and DPR $dpr", async ({ scale, dpr }) => {
  const { page, terminal } = await openTerminal(scale, dpr, {
    rows: 17,
    cols: 135,
    width: 1624,
    height: 574,
    size: 28,
  });
  const line = `${"f".repeat(134)}Z`;
  await page.evaluate(
    `window.receive("deck-term:ready", { id: "test", buffer: ${JSON.stringify(line)} })`,
  );
  await expect(terminal.getByText(line, { exact: true })).toBeVisible();
  const metrics = await terminal.getByText(line, { exact: true }).evaluate((element) => {
    const screen = element.closest(".xterm-screen");
    if (!screen) throw new Error("Missing terminal screen");
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text = walker.nextNode();
    let offset = 134;
    while (text && offset >= (text.textContent?.length ?? 0)) {
      offset -= text.textContent?.length ?? 0;
      text = walker.nextNode();
    }
    if (!text) throw new Error("Missing last terminal cell");
    const range = document.createRange();
    range.setStart(text, offset);
    range.setEnd(text, offset + 1);
    const last = range.getBoundingClientRect();
    const grid = screen.getBoundingClientRect();
    const host = screen.closest('[role="application"]');
    const frame = host?.parentElement;
    if (!host || !frame) throw new Error("Missing terminal frame");
    return {
      column: Math.round((last.left - grid.left) / (grid.width / 135)),
      end: last.right,
      edge: grid.right,
      unusedWidth: frame.getBoundingClientRect().width - host.getBoundingClientRect().width,
    };
  });
  expect(metrics.column).toBe(134);
  expect(metrics.end).toBeLessThanOrEqual(metrics.edge + 1 / dpr);
  expect(Math.abs(metrics.unusedWidth)).toBeLessThanOrEqual(1 / dpr);
});
