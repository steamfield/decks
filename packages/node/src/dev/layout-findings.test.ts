import { join } from "node:path";
import { formatHash } from "@react-decks/core";
import type { Browser } from "playwright-core";
import { beforeAll, describe, expect, it } from "vitest";
import { launchBrowser, openPreviewPage, startPreview, waitForCapture } from "./browser";
import { loadDeck } from "./config";
import { layoutFindings } from "./layout-findings";
import { build } from "./server";
import { fixture, skipBrowserTests } from "./server.test-support";

interface Case {
  name: string;
  source: string;
  findings: Awaited<ReturnType<typeof layoutFindings>>;
}

let browser: Browser;

/**
 * Builds one deck with a slide per source and serves it for the enclosing describe. The returned
 * function measures one slide at its last click, as `decks inspect` does, at 1920 x 1080.
 */
function servedDeck(sources: string[], files: Record<string, string> = {}) {
  let preview: Awaited<ReturnType<typeof startPreview>>;
  beforeAll(async () => {
    const cleanups: (() => Promise<void>)[] = [];
    // The first source replaces the fixture's own first slide, so slide n is source n.
    const slides = sources.map((source, index) => [
      index ? `slides/${String(index + 1).padStart(2, "0")}-case.mdx` : "slides/01-first.mdx",
      source,
    ]);
    const { dir } = await fixture((cleanup) => cleanups.push(cleanup), {
      ...Object.fromEntries(slides),
      ...files,
    });
    const outDir = join(dir, "site");
    await build(await loadDeck(dir), { outDir, base: "./", ogImage: false });
    preview = await startPreview(outDir, "./");
    cleanups.push(preview.close);
    return async () => {
      for (const cleanup of cleanups.reverse()) await cleanup();
    };
  });
  return async (slide: number) => {
    const hash = formatHash({ view: "play", slide, click: 0 });
    const capture = await openPreviewPage(browser, preview, `?motion=instant${hash}`);
    try {
      await waitForCapture(capture.page);
      const findings = await layoutFindings(capture.page, slide, hash);
      expect(capture.errors).toEqual([]);
      return findings;
    } finally {
      await capture.close();
    }
  };
}

type Finding = Case["findings"][number];
const outside = (pixels: number, side: Finding["side"], selector: string, excerpt: string) =>
  ({ kind: "outside", pixels, side, selector, excerpt }) satisfies Finding;
const clipped = (pixels: number, side: Finding["side"], selector: string, excerpt: string) =>
  ({ kind: "clipped", pixels, side, selector, excerpt }) satisfies Finding;

const cases: Case[] = [
  {
    name: "reports a headline that runs past the canvas edge with its overflow in px and side",
    source:
      '<h1 className="headline highlight" style={{position: "absolute", margin: 0, left: 1898, top: -9, width: 60, whiteSpace: "nowrap"}}>A headline reaches beyond the right edge of the slide.</h1>',
    findings: [outside(38, "right", "h1.headline", "A headline reaches beyond the right edg…")],
  },
  {
    name: "reports a box with overflow hidden that clips its text",
    source: [
      '<p className="card" style={{overflow: "hidden", height: 38, lineHeight: "30px"}}>First line<br />Second line</p>',
      '<p className="narrow" style={{overflowX: "hidden", width: 38}}><span style={{display: "inline-block", width: 60}}>Wide text</span></p>',
      '<p style={{overflow: "visible", height: 38, lineHeight: "30px"}}>Free line<br />Another free line</p>',
      '<p style={{overflowX: "clip", overflowY: "visible", height: 38, lineHeight: "30px"}}>Free line<br />Another free line</p>',
      '<div style={{overflow: "hidden", height: 38}}><div style={{height: 60}} /></div>',
    ].join("\n\n"),
    findings: [
      clipped(22, "bottom", "p.card", "First line Second line"),
      clipped(22, "right", "p.narrow", "Wide text"),
    ],
  },
  {
    name: "treats overflow clip as a deliberate crop and still reports hidden",
    source: [
      '<p style={{overflow: "clip", height: 38, lineHeight: "30px"}}>Masked line<br />Cropped line</p>',
      '<p className="card" style={{overflow: "hidden", height: 38, lineHeight: "30px"}}>First line<br />Second line</p>',
    ].join("\n\n"),
    findings: [clipped(22, "bottom", "p.card", "First line Second line")],
  },
  {
    name: "measures what a clipping ancestor leaves visible, not the content it crops",
    source: [
      '<div style={{overflow: "clip", width: 400, height: 200}}><div style={{width: 3000, marginLeft: -900}}>Cropped tour</div></div>',
      '<div className="loose" style={{width: 400, height: 200}}><div style={{width: 3000, marginLeft: -900}}>Loose tour</div></div>',
    ].join("\n\n"),
    findings: [outside(900, "left", "div", "Loose tour")],
  },
  {
    // The deck's above and credit layers (files below) sit past the right edge too.
    name: "reports nothing for a slide whose content fits, ignoring the above and credit layers",
    source: [
      "# Fits inside",
      '<p style={{overflow: "hidden", height: 60}}>Also inside</p>',
      '<span style={{position: "absolute", right: -1}}>One pixel of tolerance</span>',
    ].join("\n\n"),
    findings: [],
  },
  {
    name: "skips hidden, transparent and zero-size elements",
    source: [
      '<div style={{position: "absolute", left: 1940, visibility: "hidden"}}>Hidden text</div>',
      '<div style={{opacity: 0, height: 30}}><p style={{position: "absolute", left: 1940}}>Transparent text</p></div>',
      '<div style={{position: "absolute", left: 1940, width: 0, height: 30}} />',
    ].join("\n\n"),
    findings: [],
  },
  {
    name: "reports a nested overflow once, at the outermost element",
    source:
      '<div className="outer" style={{position: "absolute", right: -20, width: 100}}><p style={{position: "relative", left: 30}}>Nested text</p></div>',
    findings: [outside(20, "right", "div.outer", "Nested text")],
  },
  {
    name: "reports independent clipping inside an element outside the canvas",
    source:
      '<div className="outer" style={{position: "absolute", right: -20, width: 100}}><p style={{position: "relative", left: 30, overflow: "hidden", height: 20, lineHeight: "20px"}}>First line<br />Second line</p></div>',
    findings: [
      outside(20, "right", "div.outer", "First line Second line"),
      clipped(20, "bottom", "p", "First line Second line"),
    ],
  },
  {
    name: "reports text clipped by a box collapsed to zero height",
    source: '<p style={{overflow: "hidden", height: 0, lineHeight: "20px"}}>Collapsed copy</p>',
    findings: [clipped(20, "bottom", "p", "Collapsed copy")],
  },
  {
    name: "skips visually hidden subtrees and still reports visible overflow in small layouts",
    source: [
      '<p style={{position: "absolute", overflow: "hidden", width: 1, height: 1, lineHeight: "20px"}}>One-pixel screen-reader copy</p>',
      '<div style={{position: "absolute", overflow: "hidden", width: 1, height: 1}}><p style={{position: "absolute", left: 1940}}>Child of a one-pixel box</p></div>',
      '<div style={{position: "absolute", width: 40, height: 40, clip: "rect(0px, 0px, 0px, 0px)"}}><p style={{position: "absolute", left: 1940}}>Zero rect child</p></div>',
      '<div style={{position: "absolute", width: 40, height: 40, clip: "rect(5px, 15px, 5px, 1px)"}}><p style={{position: "absolute", left: 1940}}>Empty rect child</p></div>',
      '<div style={{position: "absolute", width: 40, height: 40, clip: "rect(auto, 0px, auto, 0px)"}}><p style={{position: "absolute", left: 1940}}>Empty rect with auto edges</p></div>',
      '<div style={{position: "absolute", width: 40, height: 40, clipPath: "inset(50%)"}}><p style={{position: "absolute", left: 1940}}>Inset child</p></div>',
      '<div style={{display: "contents"}}><p style={{overflow: "hidden", height: 2, lineHeight: "20px"}}>Short label</p></div>',
      '<div style={{height: 0}}><p style={{position: "absolute", right: -27}}>Visible child of a zero-height wrapper</p></div>',
      '<div style={{width: 1, height: 1}}><p style={{position: "absolute", right: -23}}>Visible child of a one-pixel box</p></div>',
    ].join("\n\n"),
    findings: [
      clipped(18, "bottom", "p", "Short label"),
      outside(27, "right", "p", "Visible child of a zero-height wrapper"),
      outside(23, "right", "p", "Visible child of a one-pixel box"),
    ],
  },
  {
    name: "reports horizontal clipping on the left for right-to-left text",
    source:
      '<p dir="rtl" style={{marginLeft: 100, overflow: "hidden", width: 38}}><span style={{display: "inline-block", width: 60}}>טקסט רחב</span></p>',
    findings: [clipped(22, "left", "p", "טקסט רחב")],
  },
  {
    name: "measures the SVG box and an HTML overlay without measuring SVG descendants",
    source: [
      '<svg width="100" height="100" viewBox="0 0 100 100"><rect x="2100" y="0" width="20" height="20" /></svg>',
      '<svg width="100" height="100" style={{position: "absolute", right: -16, top: 120}}><rect x="5" y="5" width="20" height="20" /></svg>',
      '<h2 style={{position: "absolute", right: -24, top: 0}}>HTML overlay</h2>',
    ].join("\n\n"),
    findings: [outside(16, "right", "svg", ""), outside(24, "right", "h2", "HTML overlay")],
  },
  {
    name: "skips aria-hidden decoration and still reports aria-hidden elements with text",
    source: [
      '<div aria-hidden="true" style={{position: "absolute", right: -30, width: 100, height: 40}}><span style={{display: "block", position: "relative", left: 80, height: 20}} /></div>',
      '<div aria-hidden="true" style={{position: "absolute", right: -24, width: 120}}><span>Visual label</span></div>',
      '<div style={{position: "absolute", right: -18, width: 100, height: 40}} />',
    ].join("\n\n"),
    findings: [outside(24, "right", "div", "Visual label"), outside(18, "right", "div", "")],
  },
];

describe.skipIf(skipBrowserTests)("layout findings", () => {
  beforeAll(async () => {
    browser = await launchBrowser();
    return () => browser.close();
  });

  describe("on the default slide styles", () => {
    const measure = servedDeck(
      cases.map(({ source }) => source),
      {
        "layers/above.tsx":
          'export default function Above() { return <p style={{position: "absolute", right: -30}}>Overlay</p>; }',
        "layers/credit.tsx":
          'export default function Credit() { return <p style={{position: "absolute", right: -30}}>Credit</p>; }',
      },
    );
    it.each(cases.map((testCase, index) => ({ ...testCase, slide: index + 1 })))(
      "$name",
      async ({ slide, findings }) => {
        expect(await measure(slide)).toEqual(findings);
      },
    );
  });

  describe("when the slide root clips its content", () => {
    const measure = servedDeck(
      [
        '<p style={{position: "absolute", bottom: 0, margin: 0, height: 30, lineHeight: "30px"}}>First line<br />Second line</p>',
      ],
      {
        "styles/index.css": "[data-deck-slide] { overflow: hidden; }",
        "layers/credit.tsx": "export default function Credit() { return null; }",
      },
    );
    it("reports when the slide root clips text", async () => {
      expect(await measure(1)).toEqual([clipped(30, "bottom", "div", "First line Second line")]);
    });
  });
});
