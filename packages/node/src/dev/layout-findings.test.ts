import { expect, it, onTestFinished } from "vitest";
import { cli, fixture, skipBrowserTests } from "./server.test-support";

const browserTest = it.skipIf(skipBrowserTests);

async function inspectSlide(source: string, files: Record<string, string> = {}) {
  const { dir } = await fixture(onTestFinished, { "slides/01-first.mdx": source, ...files });
  const command = cli(dir, ["inspect", "."]);
  const [code] = await command.exit;
  return { code, ...command.output() };
}

browserTest(
  "reports a headline that runs past the canvas edge with its overflow in px and side",
  async () => {
    const result = await inspectSlide(
      '<h1 className="headline highlight" style={{position: "absolute", margin: 0, left: 1898, top: -9, width: 60, whiteSpace: "nowrap"}}>A headline reaches beyond the right edge of the slide.</h1>',
    );
    expect(result).toEqual({
      code: 1,
      stdout:
        'slide 1 (01-first.mdx): outside by 38px right: h1.headline "A headline reaches beyond the right edg…"\n1 finding in 1 slide\n',
      stderr: "",
    });
  },
);

browserTest("reports a box with overflow hidden that clips its text", async () => {
  const result = await inspectSlide(
    [
      '<p className="card" style={{overflow: "hidden", height: 38, lineHeight: "30px"}}>First line<br />Second line</p>',
      '<p className="narrow" style={{overflowX: "hidden", width: 38}}><span style={{display: "inline-block", width: 60}}>Wide text</span></p>',
      '<p style={{overflow: "visible", height: 38, lineHeight: "30px"}}>Free line<br />Another free line</p>',
      '<p style={{overflowX: "clip", overflowY: "visible", height: 38, lineHeight: "30px"}}>Free line<br />Another free line</p>',
      '<div style={{overflow: "hidden", height: 38}}><div style={{height: 60}} /></div>',
    ].join("\n\n"),
  );
  expect(result).toEqual({
    code: 1,
    stdout: [
      'slide 1 (01-first.mdx): clipped by 22px bottom: p.card "First line Second line"',
      'slide 1 (01-first.mdx): clipped by 22px right: p.narrow "Wide text"',
      "2 findings in 1 slide\n",
    ].join("\n"),
    stderr: "",
  });
});

browserTest("treats overflow clip as a deliberate crop and still reports hidden", async () => {
  const result = await inspectSlide(
    [
      '<p style={{overflow: "clip", height: 38, lineHeight: "30px"}}>Masked line<br />Cropped line</p>',
      '<p className="card" style={{overflow: "hidden", height: 38, lineHeight: "30px"}}>First line<br />Second line</p>',
    ].join("\n\n"),
  );
  expect(result).toEqual({
    code: 1,
    stdout: [
      'slide 1 (01-first.mdx): clipped by 22px bottom: p.card "First line Second line"',
      "1 finding in 1 slide\n",
    ].join("\n"),
    stderr: "",
  });
});

browserTest(
  "measures what a clipping ancestor leaves visible, not the content it crops",
  async () => {
    const result = await inspectSlide(
      [
        '<div style={{overflow: "clip", width: 400, height: 200}}><div style={{width: 3000, marginLeft: -900}}>Cropped tour</div></div>',
        '<div className="loose" style={{width: 400, height: 200}}><div style={{width: 3000, marginLeft: -900}}>Loose tour</div></div>',
      ].join("\n\n"),
    );
    expect(result.stdout).not.toContain("Cropped tour");
    expect(result.stdout).toContain('div "Loose tour"');
  },
);

browserTest("reports nothing for a slide whose content fits", async () => {
  const result = await inspectSlide(
    [
      "# Fits inside",
      '<p style={{overflow: "hidden", height: 60}}>Also inside</p>',
      '<span style={{position: "absolute", right: -1}}>One pixel of tolerance</span>',
    ].join("\n\n"),
    {
      "layers/above.tsx":
        'export default function Above() { return <p style={{position: "absolute", right: -30}}>Overlay</p>; }',
      "layers/credit.tsx":
        'export default function Credit() { return <p style={{position: "absolute", right: -30}}>Credit</p>; }',
    },
  );
  expect(result).toEqual({ code: 0, stdout: "no layout findings in 1 slide\n", stderr: "" });
});

browserTest("skips hidden, transparent and zero-size elements", async () => {
  const result = await inspectSlide(
    [
      '<div style={{position: "absolute", left: 1940, visibility: "hidden"}}>Hidden text</div>',
      '<div style={{opacity: 0, height: 30}}><p style={{position: "absolute", left: 1940}}>Transparent text</p></div>',
      '<div style={{position: "absolute", left: 1940, width: 0, height: 30}} />',
    ].join("\n\n"),
  );
  expect(result).toEqual({ code: 0, stdout: "no layout findings in 1 slide\n", stderr: "" });
});

browserTest("reports a nested overflow once, at the outermost element", async () => {
  const result = await inspectSlide(
    '<div className="outer" style={{position: "absolute", right: -20, width: 100}}><p style={{position: "relative", left: 30}}>Nested text</p></div>',
  );
  expect(result).toEqual({
    code: 1,
    stdout:
      'slide 1 (01-first.mdx): outside by 20px right: div.outer "Nested text"\n1 finding in 1 slide\n',
    stderr: "",
  });
});

browserTest("reports when the slide root clips text", async () => {
  const result = await inspectSlide(
    '<p style={{position: "absolute", bottom: 0, margin: 0, height: 30, lineHeight: "30px"}}>First line<br />Second line</p>',
    {
      "styles/index.css": "[data-deck-slide] { overflow: hidden; }",
      "layers/credit.tsx": "export default function Credit() { return null; }",
    },
  );
  expect(result).toEqual({
    code: 1,
    stdout:
      'slide 1 (01-first.mdx): clipped by 30px bottom: div "First line Second line"\n1 finding in 1 slide\n',
    stderr: "",
  });
});

browserTest("reports independent clipping inside an element outside the canvas", async () => {
  const result = await inspectSlide(
    '<div className="outer" style={{position: "absolute", right: -20, width: 100}}><p style={{position: "relative", left: 30, overflow: "hidden", height: 20, lineHeight: "20px"}}>First line<br />Second line</p></div>',
  );
  expect(result).toEqual({
    code: 1,
    stdout: [
      'slide 1 (01-first.mdx): outside by 20px right: div.outer "First line Second line"',
      'slide 1 (01-first.mdx): clipped by 20px bottom: p "First line Second line"',
      "2 findings in 1 slide\n",
    ].join("\n"),
    stderr: "",
  });
});

browserTest("reports text clipped by a box collapsed to zero height", async () => {
  const result = await inspectSlide(
    '<p style={{overflow: "hidden", height: 0, lineHeight: "20px"}}>Collapsed copy</p>',
  );
  expect(result).toEqual({
    code: 1,
    stdout:
      'slide 1 (01-first.mdx): clipped by 20px bottom: p "Collapsed copy"\n1 finding in 1 slide\n',
    stderr: "",
  });
});

browserTest(
  "skips visually hidden subtrees and still reports visible overflow in small layouts",
  async () => {
    const result = await inspectSlide(
      [
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
    );
    expect(result).toEqual({
      code: 1,
      stdout: [
        'slide 1 (01-first.mdx): clipped by 18px bottom: p "Short label"',
        'slide 1 (01-first.mdx): outside by 27px right: p "Visible child of a zero-height wrapper"',
        'slide 1 (01-first.mdx): outside by 23px right: p "Visible child of a one-pixel box"',
        "3 findings in 1 slide\n",
      ].join("\n"),
      stderr: "",
    });
  },
);

browserTest("reports horizontal clipping on the left for right-to-left text", async () => {
  const result = await inspectSlide(
    '<p dir="rtl" style={{marginLeft: 100, overflow: "hidden", width: 38}}><span style={{display: "inline-block", width: 60}}>טקסט רחב</span></p>',
  );
  expect(result).toEqual({
    code: 1,
    stdout: 'slide 1 (01-first.mdx): clipped by 22px left: p "טקסט רחב"\n1 finding in 1 slide\n',
    stderr: "",
  });
});

browserTest(
  "measures the SVG box and an HTML overlay without measuring SVG descendants",
  async () => {
    const result = await inspectSlide(
      [
        '<svg width="100" height="100" viewBox="0 0 100 100"><rect x="2100" y="0" width="20" height="20" /></svg>',
        '<svg width="100" height="100" style={{position: "absolute", right: -16, top: 120}}><rect x="5" y="5" width="20" height="20" /></svg>',
        '<h2 style={{position: "absolute", right: -24, top: 0}}>HTML overlay</h2>',
      ].join("\n\n"),
    );
    expect(result).toEqual({
      code: 1,
      stdout: [
        'slide 1 (01-first.mdx): outside by 16px right: svg ""',
        'slide 1 (01-first.mdx): outside by 24px right: h2 "HTML overlay"',
        "2 findings in 1 slide\n",
      ].join("\n"),
      stderr: "",
    });
  },
);

browserTest(
  "skips aria-hidden decoration and still reports aria-hidden elements with text",
  async () => {
    const result = await inspectSlide(
      [
        '<div aria-hidden="true" style={{position: "absolute", right: -30, width: 100, height: 40}}><span style={{display: "block", position: "relative", left: 80, height: 20}} /></div>',
        '<div aria-hidden="true" style={{position: "absolute", right: -24, width: 120}}><span>Visual label</span></div>',
        '<div style={{position: "absolute", right: -18, width: 100, height: 40}} />',
      ].join("\n\n"),
    );
    expect(result).toEqual({
      code: 1,
      stdout: [
        'slide 1 (01-first.mdx): outside by 24px right: div "Visual label"',
        'slide 1 (01-first.mdx): outside by 18px right: div ""',
        "2 findings in 1 slide\n",
      ].join("\n"),
      stderr: "",
    });
  },
);

browserTest(
  "prints ten findings per slide and counts the omitted findings in the summary",
  async () => {
    const label = (index: number) =>
      `<p style={{position: "absolute", right: -${index + 1}}}>Label ${index}</p>`;
    const result = await inspectSlide(
      Array.from({ length: 12 }, (_, index) => label(index + 1)).join("\n\n"),
      {
        "slides/02-ten.mdx": Array.from({ length: 10 }, (_, index) => label(index + 1)).join(
          "\n\n",
        ),
      },
    );
    const lines = (slide: string) =>
      Array.from(
        { length: 10 },
        (_, index) => `${slide}: outside by ${index + 2}px right: p "Label ${index + 1}"`,
      );
    expect(result).toEqual({
      code: 1,
      stdout: [
        ...lines("slide 1 (01-first.mdx)"),
        "... and 2 more on slide 1",
        ...lines("slide 2 (02-ten.mdx)"),
        "22 findings in 2 slides\n",
      ].join("\n"),
      stderr: "",
    });
  },
);
