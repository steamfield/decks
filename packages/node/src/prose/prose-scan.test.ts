import { readFileSync } from "node:fs";
import { expect, it, onTestFinished } from "vitest";
import { fixture } from "../dev/server.test-support";
import { loadPatterns, patternsFile } from "./prose-patterns";
import { scanSource } from "./prose-scan";

const scan = (source: string, file = "slide.mdx", errorsOnly = false) =>
  scanSource(file, source, loadPatterns(), { errorsOnly });

it("reads CRLF patterns, blank rows and whitespace without changing the scan", async () => {
  const original = readFileSync(patternsFile, "utf8");
  const { dir } = await fixture(onTestFinished, {
    "patterns.tsv": `${original.replaceAll("\n", "\r\n")}\r\n  \r\n\t\r\n`,
  });
  expect(
    scanSource("x.mdx", "An em — dash.", loadPatterns(`${dir}/patterns.tsv`), {
      errorsOnly: false,
    }),
  ).toEqual(scan("An em — dash.", "x.mdx"));
});

it.each([
  ["", "no error-severity patterns"],
  ["x\twarn\tfoo\tbar", "no error-severity patterns"],
  ["x\terorr\tfoo\tbar", 'severity "erorr"'],
  ["x\terror\t\tbar", "has no regex"],
  ["x\terror\t[\tbar", "Invalid regular expression"],
])("refuses an unusable pattern file %j", async (source, message) => {
  const { dir } = await fixture(onTestFinished, { "patterns.tsv": source });
  expect(() => loadPatterns(`${dir}/patterns.tsv`)).toThrow(message);
});

it("reports the pattern, severity and original prose position", () => {
  expect(scan("# Clean.\n\nIt's not just a chart, it's a story.")).toEqual([
    expect.objectContaining({
      file: "slide.mdx",
      line: 3,
      col: 1,
      severity: "error",
      id: "not-just-reveal",
    }),
  ]);
});

it.each([
  "```mdx\nIt's not just a chart, it's a story.\n```",
  "~~~\nAn em — dash.\n~~~",
  "`An em — dash.`",
  "import X from 'seamless';\n\nClean.",
  "export const label = 'seamless';\n\nClean.",
  "---\ntitle: seamless\n---\nClean.",
  "{/*\nAn em — dash.\n*/}",
  "<Disclosure>\n\nAn em — dash.\n\n</Disclosure>",
])("skips code, metadata and non-prose in %j", (source) => expect(scan(source)).toEqual([]));

it("scans prose after multiline JSX comments and honors allow markers on their closing line", () => {
  expect(scan("{/*\nhidden\n*/} An em — dash.")[0]).toMatchObject({
    line: 3,
    col: 9,
    id: "em-dash",
  });
  expect(scan("{/*\nhidden\n*/} An em — dash. {/* lint-allow: em-dash */}")).toEqual([]);
});

it("scans JSX text and string-literal MDX props, skipping expression code", () => {
  const hits = scan(
    '<Card title="A seamless experience" body={"At its core, tides."}>An em — dash.</Card>\n\n{someCode("seamless")}',
  );
  expect(hits.map((hit) => hit.id).sort()).toEqual(["ai-vocab", "banned-phrase", "em-dash"]);
  expect(hits.find((hit) => hit.id === "ai-vocab")).toMatchObject({ line: 1, col: 16 });
});

it("scans speaker notes only as warnings, including nested JSX and props", () => {
  const source =
    '<Notes>\n\nAn em — dash.\n\n<Card title="seamless">At its core, tides.</Card>\n\n</Notes>';
  expect(scan(source)).toHaveLength(3);
  expect(scan(source).every((hit) => hit.severity === "warn")).toBe(true);
  expect(scan(source, "x.mdx", true)).toEqual([]);
});

it.each(["stage.ts", "stage.tsx"])(
  "scans COPY lead and body strings in %s with comments and nested brackets",
  (file) => {
    const source = [
      "const label = 'seamless — not card copy';",
      "// const COPY = [{lead: 'seamless'}];",
      "const COPY = [",
      "  { lead: 'High water.', body: `At its core, tides [rise].` },",
      "  { lead: 'Quoted — verbatim.' }, // lint-allow: em-dash",
      "  { other: 'seamless', body: 'A seamless tide.' },",
      "] as const;",
    ].join("\n");
    expect(scan(source, file).map((hit) => [hit.id, hit.line])).toEqual([
      ["banned-phrase", 4],
      ["ai-vocab", 6],
    ]);
  },
);

it("scans TSX text but leaves ordinary code, comments and props alone", () => {
  expect(
    scan(
      'const x = "seamless"; export const Stage = () => <p title="seamless">An em — dash.{/* seamless */}</p>',
      "stage.tsx",
    ),
  ).toEqual([expect.objectContaining({ id: "em-dash", line: 1 })]);
});

it("allows selected patterns and keeps the other hits on that line", () => {
  expect(
    scan("An em — dash. At its core, tides. {/* lint-allow: em-dash */}").map((hit) => hit.id),
  ).toEqual(["banned-phrase"]);
  expect(scan("An em — dash. At its core, tides. {/* lint-allow */}")).toEqual([]);
});

it.each(["<Card>", "{/* unclosed"])("refuses malformed MDX %s", (source) =>
  expect(() => scan(source)).toThrow(),
);
it("refuses malformed TSX instead of scanning a partial AST", () =>
  expect(() => scan("const COPY = [", "stage.tsx")).toThrow("Check the component syntax"));

it("scans only arrays named COPY, including typed and satisfies declarations", () => {
  expect(scan("const COPY = {lead: 'seamless'};", "copy.ts")).toEqual([]);
  expect(
    scan("const COPY = [{lead: 'seamless'}] satisfies readonly {lead: string}[];", "copy.ts"),
  ).toHaveLength(1);
});

it("scans JSX text nested inside MDX expressions and JSX-valued props", () => {
  const hits = scan(
    "<Card title={<span>A seamless tide.</span>} />\n\n{true && <p>At its core, tides.</p>}",
  );
  expect(hits.map((hit) => hit.id).sort()).toEqual(["ai-vocab", "banned-phrase"]);
});

it("reports the actual line and column of a multiline literal prop expression", () => {
  expect(scan('<Card title={\n  "At its core, tides."\n} />')[0]).toMatchObject({
    line: 2,
    col: 4,
    id: "banned-phrase",
  });
});

it.each([
  ["x.mdx", "It's <em>not just</em> a chart, it's a story."],
  ["x.tsx", "export const Stage = () => <p>It's <em>not just</em> a chart, it's a story.</p>;"],
])("scans a phrase across inline JSX nodes in %s", (file, source) => {
  expect(scan(source, file).map((hit) => hit.id)).toContain("not-just-reveal");
});

it("scans the static portions of interpolated COPY templates", () => {
  expect(
    scan(`const COPY = [{body: \`It's not just \${subject}, it's a story.\`}];`, "copy.tsx").map(
      (hit) => hit.id,
    ),
  ).toContain("not-just-reveal");
});

it("keeps separate JSX components and conditional branches separate", () => {
  expect(
    scan("const A = () => <p>At its </p>; const B = () => <p>core, tides.</p>;", "x.tsx"),
  ).toEqual([]);
  expect(
    scan("const A = () => flag ? <span>At its </span> : <span>core, tides.</span>;", "x.tsx"),
  ).toEqual([]);
  expect(
    scan(
      "const A = () => <p>{flag ? <span>At its </span> : <span>core, tides.</span>}</p>;",
      "x.tsx",
    ),
  ).toEqual([]);
});

it("joins JSX text separated only by a comment", () => {
  expect(scan("const A = () => <p>It's {/* aside */}not just a chart.</p>;", "x.tsx")[0]?.id).toBe(
    "not-just-reveal",
  );
});

it("scans literal props inside nested MDX JSX expressions", () => {
  expect(scan('<Card body={<Badge title="seamless" />} />')[0]).toMatchObject({
    id: "ai-vocab",
    col: 27,
  });
});

it("scans a parenthesized COPY array", () => {
  expect(scan('const COPY = ([{body: "seamless"}]);', "x.tsx")[0]?.id).toBe("ai-vocab");
});

it("maps decoded entities and string escapes back to source positions", () => {
  expect(scan("&#65; seamless")[0]).toMatchObject({ col: 7 });
  expect(scan('const COPY = [{body: "\\u0041 seamless"}];', "x.tsx")[0]).toMatchObject({ col: 30 });
  expect(scan('<Card body={<Badge title="&#65; seamless" />} />')[0]).toMatchObject({ col: 33 });
  expect(scan("&#65;\r\nseamless")[0]).toMatchObject({ line: 2, col: 1 });
});

it("includes the parser's known position in TSX syntax errors", () => {
  expect(() => scan("const x = 1;\nconst COPY = [;", "stage.tsx")).toThrow("stage.tsx:2:");
});
