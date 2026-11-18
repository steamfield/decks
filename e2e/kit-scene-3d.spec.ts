import { chromium, expect, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import { startSettling } from "./fixtures/deck-driver";
import { kitFixture } from "./fixtures/kit.fixture";
import { test } from "./fixtures/motion.fixture";
import { slideNo } from "./fixtures/motion-gallery";

const label = "Three studio forms";
function liveCanvas(page: Page) {
  return page.getByRole("img", { name: label }).locator("canvas");
}

test("Scene3D renders a WebGL canvas with role img and its label on the active live slide", async ({
  page,
  deck,
}) => {
  await deck.goto(slideNo("scene-3d"));
  const canvas = liveCanvas(page);
  await expect(canvas).toBeVisible();
  expect(
    await canvas.evaluate((canvas) => {
      if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Expected a canvas");
      return canvas.getContext("webgl2")?.isContextLost();
    }),
  ).toBe(false);
  const host = page.getByRole("img", { name: label });
  await host.evaluate((el) => {
    if (el instanceof HTMLElement) el.style.width = "800px";
  });
  await expect
    .poll(() =>
      canvas.evaluate((el) => el instanceof HTMLCanvasElement && el.width / devicePixelRatio),
    )
    .toBe(800);
  const pixels = PNG.sync.read(await canvas.screenshot());
  expect(pixels.data.some((g, i) => i % 4 === 1 && g > pixels.data.readUInt8(i - 1) + 30)).toBe(
    true,
  );
  await page.setViewportSize({ width: 960, height: 540 });
  const bufferWidth = () => canvas.evaluate((el) => el instanceof HTMLCanvasElement && el.width);
  await expect.poll(bufferWidth).toBe(400);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 961,
    height: 540,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await expect.poll(bufferWidth).toBe(800);
});

test("Scene3D releases its WebGL context when the slide stops being active", async ({
  page,
  deck,
}) => {
  await deck.goto(slideNo("scene-3d"));
  const context = await liveCanvas(page).evaluateHandle((el) => {
    if (!(el instanceof HTMLCanvasElement)) throw new Error("Expected a canvas");
    const gl = el.getContext("webgl2");
    if (!gl) throw new Error("Missing live WebGL context");
    return gl;
  });
  await deck.press("ArrowUp");
  await expect.poll(() => context.evaluate((gl) => gl.isContextLost())).toBe(true);
  await context.dispose();
});

test("Scene3D falls back to the poster with one warning when three fails to load", async ({
  page,
  deck,
}) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" && message.text().includes("49-scene-3d"))
      warnings.push(message.text());
  });
  await page.route(/\/three(?:\.module)?\.js(?:\?|$)/, (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: 'throw new Error("three unavailable")',
    }),
  );
  await deck.goto(slideNo("scene-3d"));
  await expect.poll(() => warnings.length).toBe(1);
  await deck.press("ArrowRight");
  await deck.settled();
  const host = page.getByRole("img", { name: label });
  await expect(host.locator("svg")).toBeVisible();
  await expect(host.locator("canvas")).toHaveCount(0);
  expect(warnings).toHaveLength(1);
});

test("Scene3D renders a frame on each timeline update and none while idle", async ({
  page,
  deck,
  motionClock,
}) => {
  await page.goto(`/#/${slideNo("scene-3d")}`);
  const canvas = liveCanvas(page);
  await expect(canvas).toBeVisible();
  await motionClock.pauseAt();
  await motionClock.settle();
  // A GPU occlusion query reports whether geometry painted any samples in this interval.
  async function painted(ms: number) {
    const measurement = await canvas.evaluateHandle((el) => {
      if (!(el instanceof HTMLCanvasElement)) throw new Error("Expected a canvas");
      const gl = el.getContext("webgl2");
      if (!gl) throw new Error("Missing live WebGL context");
      const query = gl.createQuery();
      gl.beginQuery(gl.ANY_SAMPLES_PASSED, query);
      return { gl, query };
    });
    await motionClock.step(ms);
    await measurement.evaluate(({ gl }) => {
      gl.endQuery(gl.ANY_SAMPLES_PASSED);
      gl.finish();
    });
    await expect
      .poll(() =>
        measurement.evaluate(({ gl, query }) =>
          gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE),
        ),
      )
      .toBe(true);
    const visible = await measurement.evaluate(({ gl, query }) => {
      const result = Boolean(gl.getQueryParameter(query, gl.QUERY_RESULT));
      gl.deleteQuery(query);
      return result;
    });
    await measurement.dispose();
    return visible;
  }
  expect(await painted(160)).toBe(false);
  await deck.press("ArrowRight");
  await motionClock.step(64);
  expect(await painted(16)).toBe(true);
  expect(await painted(16)).toBe(true);
  await motionClock.settle();
  expect(await painted(160)).toBe(false);
});

test("a cold live scene settles on the latest click after the renderer arrives", async ({
  page,
  motionClock,
}) => {
  const requested = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  await page.route(/\/three\.js(?:\?|$)/, async (route) => {
    requested.resolve();
    await release.promise;
    await route.continue();
  });
  try {
    await page.goto(`/#/${slideNo("scene-3d")}`);
    await requested.promise;
    await motionClock.pauseAt();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const completion = await startSettling(page);
    await motionClock.step(1000);
    const host = page.getByRole("img", { name: label });
    expect(await completion.evaluate((s) => s.done)).toBe(false);
    await expect(host.locator("svg, canvas")).toHaveCount(0);
    release.resolve();
    await liveCanvas(page).waitFor();
    await motionClock.settle();
    expect(await completion.evaluate((s) => s.done)).toBe(true);
    await expect(page).toHaveURL(/clicks=2$/);
    await completion.dispose();
  } finally {
    release.resolve();
  }
});

test("WebGL unavailability leaves a capturable poster", async ({ baseURL }) => {
  const browser = await chromium.launch({ args: ["--disable-webgl"] });
  try {
    const page = await browser.newPage({ baseURL });
    const errors: string[] = [],
      warnings: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
      if (m.type() === "warning" && m.text().includes("49-scene-3d")) warnings.push(m.text());
    });
    await page.goto(`/#/${slideNo("scene-3d")}`);
    await expect.poll(() => warnings.length).toBe(1);
    await expect(page.getByRole("img", { name: label }).locator("svg")).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});

test("a context lost during a hold gives way to the poster", async ({ page, deck }) => {
  await deck.goto(slideNo("scene-3d"), 1);
  await liveCanvas(page).evaluate((el) => {
    if (!(el instanceof HTMLCanvasElement)) throw new Error("Missing canvas");
    const extension = el.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("Missing WEBGL_lose_context");
    extension.loseContext();
  });
  await expect(page.getByRole("img", { name: label }).locator("svg")).toBeVisible();
  await expect(liveCanvas(page)).toHaveCount(0);
});

test("setup receives the host aspect and releases its resources on departure", async ({
  page,
  deckServer,
}) => {
  const server = await kitFixture(deckServer, {
    "slides/01-scene.mdx": `import { Scene3D } from "@steamfield/decks/kit";

<h1>Studio</h1>
<div style={{width: 600, height: 200}}>
  <Scene3D label="Studio" poster="Still" setup={({ camera }, tl, beat) => {
    document.title = "Camera aspect " + camera.aspect;
    beat(0);
    return () => { document.title = "Studio released"; };
  }} />
</div>`,
    "slides/02-end.mdx": "<h1>End</h1>",
  });
  try {
    await page.goto(server.url);
    await expect(page).toHaveTitle("Camera aspect 3");
    await page.keyboard.press("ArrowDown");
    await expect(page).toHaveTitle("Studio released");
  } finally {
    await server.close();
  }
});

test("static views and inactive neighbours allocate no WebGL contexts", async ({ page }) => {
  const no = slideNo("scene-3d");
  await page.addInitScript(() => {
    const contexts = new Set<WebGL2RenderingContext>();
    const proto = HTMLCanvasElement.prototype;
    proto.getContext = new Proxy(proto.getContext, {
      apply(get, canvas, args) {
        const context = Reflect.apply(get, canvas, args);
        if (context instanceof WebGL2RenderingContext) contexts.add(context);
        return context;
      },
    });
    Object.defineProperty(window, "webglContextCount", { get: () => contexts.size });
  });
  for (const [url, context] of [
    [`/?motion=instant#/${no}`, "slide"],
    [`/#/presenter/${no}`, "presenter"],
    [`/#/presenter/${no}?clicks=1`, "preview"],
    [`/#/overview/${no}`, "overview"],
    ["/?print=final#/print", "print"],
    [`/#/${no - 1}`, "slide"],
  ]) {
    if (!url) throw new Error("Missing scene URL");
    await page.goto(url);
    const host = page.locator(`[data-deck-context="${context}"][data-deck-slide="${no}"]`);
    await expect(host.locator("svg").last()).toBeAttached();
    const state = await startSettling(page);
    await state.evaluate((s) => s.promise);
    await state.dispose();
    expect(await page.evaluate(() => Reflect.get(window, "webglContextCount"))).toBe(0);
  }
});
