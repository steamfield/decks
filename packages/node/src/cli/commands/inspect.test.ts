import { createServer } from "node:http";
import { expect, it, onTestFinished } from "vitest";
import { cli, fixture, skipBrowserTests } from "../../dev/server.test-support";

const browserTest = it.skipIf(skipBrowserTests);

async function inspect(files: Record<string, string>, flags: string[] = []) {
  const { dir } = await fixture(onTestFinished, files);
  const command = cli(dir, ["inspect", ".", ...flags]);
  const [code] = await command.exit;
  return { code, ...command.output() };
}

browserTest(
  "checks each slide at its last click, so a step that reveals overflowing text is reported",
  async () => {
    const result = await inspect({
      "slides/01-first.mdx":
        '<Step at={2}><h1 style={{position: "absolute", right: -28}}>Final first headline</h1></Step>',
      "slides/02-second.mdx":
        '<Step at={3}><h2 style={{position: "absolute", right: -34}}>Final second headline</h2></Step>',
    });
    expect(result).toEqual({
      code: 1,
      stdout: [
        'slide 1 (01-first.mdx): outside by 28px right: h1 "Final first headline"',
        'slide 2 (02-second.mdx): outside by 34px right: h2 "Final second headline"',
        "2 findings in 2 slides\n",
      ].join("\n"),
      stderr: "",
    });
  },
);

browserTest("prints findings sorted by slide and document order, then the summary", async () => {
  const result = await inspect({
    "slides/01-first.mdx":
      '<p className="first" style={{position: "absolute", right: -12}}>First slide</p>',
    "slides/02-hidden.mdx": '---\nhide: true\n---\n\n{(() => { throw new Error("Hidden"); })()}',
    "slides/03-second.mdx": [
      '<h2 className="z" style={{position: "absolute", right: -24}}>First in the document</h2>',
      '<p className="a" style={{position: "absolute", bottom: -36, margin: 0}}>Second in the document</p>',
      '<p className="card" style={{overflow: "hidden", height: 20, lineHeight: "20px"}}>Third in<br />the document</p>',
    ].join("\n\n"),
    "slides/04-fit.mdx": "# Fits",
  });
  expect(result).toEqual({
    code: 1,
    stdout: [
      'slide 1 (01-first.mdx): outside by 12px right: p.first "First slide"',
      'slide 2 (03-second.mdx): outside by 24px right: h2.z "First in the document"',
      'slide 2 (03-second.mdx): outside by 36px bottom: p.a "Second in the document"',
      'slide 2 (03-second.mdx): clipped by 20px bottom: p.card "Third in the document"',
      "4 findings in 2 slides\n",
    ].join("\n"),
    stderr: "",
  });
});

browserTest("exits 1 with findings and 0 without", async () => {
  const withFinding = await inspect(
    {
      "slides/01-first.mdx": '<p className="edge">Off the left edge</p>',
      "styles/index.css":
        "@media (width: 960px) and (height: 540px) { .edge { position: absolute; left: -20px; } }",
    },
    ["--width", "960", "--height", "540"],
  );
  const withoutFindings = await inspect({});
  expect([withFinding, withoutFindings]).toEqual([
    {
      code: 1,
      stdout:
        'slide 1 (01-first.mdx): outside by 10px left: p.edge "Off the left edge"\n1 finding in 1 slide\n',
      stderr: "",
    },
    { code: 0, stdout: "no layout findings in 1 slide\n", stderr: "" },
  ]);
});

browserTest("names the slide when the page errors during capture", async () => {
  const result = await inspect({
    "slides/02-broken.mdx": "<BrokenCapture />",
    "components/BrokenCapture.tsx": [
      'import { useEffect } from "react";',
      'import { useSlide } from "@react-decks/runtime";',
      "export function BrokenCapture() {",
      "  const { isActive } = useSlide();",
      "  useEffect(() => {",
      '    if (isActive) queueMicrotask(() => { throw new Error("Broken capture frame"); });',
      "  }, [isActive]);",
      "  return null;",
      "}",
    ].join("\n"),
  });
  expect(result).toEqual({
    code: 1,
    stdout: "",
    stderr: "decks inspect: Cannot capture slide 2 (02-broken.mdx): Broken capture frame\n",
  });
});

browserTest("reports that the requested frame changed while the deck was settling", async () => {
  const result = await inspect({
    "slides/01-first.mdx": "<Redirect />",
    "slides/02-target.mdx": '<p style={{position: "absolute", right: -20}}>Different slide</p>',
    "components/Redirect.tsx": [
      'import { useLayoutEffect } from "react";',
      'import { useDeck, useSlide } from "@react-decks/runtime";',
      "export function Redirect() {",
      "  const { isActive } = useSlide();",
      "  const { go } = useDeck();",
      "  useLayoutEffect(() => { if (isActive) go(2); }, [isActive, go]);",
      "  return null;",
      "}",
    ].join("\n"),
  });
  expect(result).toEqual({
    code: 1,
    stdout: "",
    stderr:
      "decks inspect: Cannot capture slide 1 (01-first.mdx): Expected #/1, but the deck settled at #/2.\n",
  });
});

browserTest("reports a page error raised while measuring the slide", async () => {
  const result = await inspect({
    "slides/01-first.mdx": "<BrokenMeasurement />",
    // Raise a real Chromium pageerror on the geometry read, after the slide has settled.
    "components/BrokenMeasurement.tsx": [
      'import { useLayoutEffect, useRef } from "react";',
      "export function BrokenMeasurement() {",
      "  const ref = useRef(null);",
      "  useLayoutEffect(() => {",
      "    const heading = ref.current;",
      "    const readBounds = heading.getBoundingClientRect.bind(heading);",
      "    heading.getBoundingClientRect = () => {",
      '      queueMicrotask(() => { throw new Error("Broken during measurement"); });',
      "      return readBounds();",
      "    };",
      "    return () => { delete heading.getBoundingClientRect; };",
      "  }, []);",
      '  return <h1 ref={ref} style={{position: "absolute", right: -20}}>Measured headline</h1>;',
      "}",
    ].join("\n"),
  });
  expect(result).toEqual({
    code: 1,
    stdout: "",
    stderr: "decks inspect: Cannot capture slide 1 (01-first.mdx): Broken during measurement\n",
  });
});

browserTest("inspects every slide against one preview server", async () => {
  // Each slide reports the origin it was served from, and holds settling until that lands.
  const origins: string[] = [];
  const server = createServer((request, response) => {
    origins.push(new URL(request.url ?? "/", "http://recorder").searchParams.get("origin") ?? "");
    response.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  onTestFinished(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error(`No TCP address: ${address}`);
  const { port } = address;
  const result = await inspect({
    "slides/01-first.mdx": "<ReportOrigin />",
    "slides/02-second.mdx": "<ReportOrigin />",
    "slides/03-third.mdx": "<ReportOrigin />",
    "components/ReportOrigin.tsx": [
      'import { useLayoutEffect } from "react";',
      'import { registerSettleProbe, useSlide } from "@react-decks/runtime";',
      "export function ReportOrigin() {",
      "  const { isActive } = useSlide();",
      "  useLayoutEffect(() => {",
      "    if (!isActive) return;",
      "    let sent = false;",
      `    fetch("http://127.0.0.1:${port}/?origin=" + encodeURIComponent(location.origin), { mode: "no-cors" })`,
      "      .finally(() => { sent = true; });",
      '    return registerSettleProbe(() => !sent, "origin report");',
      "  }, [isActive]);",
      "  return <p>Reported</p>;",
      "}",
    ].join("\n"),
  });
  expect(result).toEqual({ code: 0, stdout: "no layout findings in 3 slides\n", stderr: "" });
  expect(origins).toHaveLength(3);
  expect(new Set(origins).size).toBe(1);
});
