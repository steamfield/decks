import { glob, readFile } from "node:fs/promises";
import { expect, it } from "vitest";

it("each test file stays within 300 lines", async () => {
  const oversized: string[] = [];
  for await (const path of glob("{packages,e2e,tests}/**/*.{test.ts,test.tsx,spec.ts}", {
    exclude: ["**/node_modules/**"],
  })) {
    const source = await readFile(path, "utf8");
    const lines = source.split("\n").length - Number(source.endsWith("\n"));
    if (lines > 300) oversized.push(`${path}: ${lines} lines`);
  }
  expect(oversized, oversized.join("\n")).toEqual([]);
});
