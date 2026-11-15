import { globSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseSync, Visitor } from "oxc-parser";
import { expect, it } from "vitest";

function durations(source: string, file = "fixture.tsx"): number[] {
  const parsed = parseSync(file, source);
  expect(parsed.errors, file).toEqual([]);
  const found: number[] = [];
  new Visitor({
    Property(node) {
      const key = node.key;
      if (
        (key.type === "Identifier" ? key.name : key.type === "Literal" ? key.value : null) !==
        "duration"
      )
        return;
      const value = node.value;
      if (value.type === "Literal" && typeof value.value === "number" && value.value !== 0)
        found.push(value.value);
      if (
        value.type === "UnaryExpression" &&
        value.argument.type === "Literal" &&
        typeof value.argument.value === "number" &&
        value.argument.value !== 0
      )
        found.push(value.operator === "-" ? -value.argument.value : value.argument.value);
    },
  }).visit(parsed.program);
  return found;
}

it("rejects a raw pace, including a quoted property, and permits tokens and zero", () => {
  expect(durations('gsap.to(el, { duration: 0.6 }); const b = { "duration": .3 }')).toEqual([
    0.6, 0.3,
  ]);
  expect(
    durations("gsap.to(el, { duration: DUR.grow }); const b = { duration: 0 }; // duration: .6"),
  ).toEqual([]);
  expect(durations("export const enter = { duration: 900 };", "fixture.ts")).toEqual([900]);
});

it("uses duration tokens in every kit module outside the token table", () => {
  const root = fileURLToPath(new URL("../packages/kit/src/", import.meta.url));
  const files = [
    ...globSync("**/*.ts", { cwd: root }),
    ...globSync("**/*.tsx", { cwd: root }),
  ].filter((file) => !/\.(test|test-support)\.tsx?$/.test(file) && file !== "theme/easings.ts");
  expect(files.length).toBeGreaterThan(0);
  expect(
    files.flatMap((file) =>
      durations(readFileSync(`${root}/${file}`, "utf8"), file).map((value) => `${file}: ${value}`),
    ),
  ).toEqual([]);
});
