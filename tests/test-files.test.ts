import { glob, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("each test file stays within 300 lines", async () => {
  const oversized: string[] = [];
  const root = fileURLToPath(new URL("../", import.meta.url));
  let count = 0;
  for await (const path of glob("{packages,e2e,tests}/**/*.{test.ts,test.tsx,spec.ts}", {
    cwd: root,
    exclude: ["**/node_modules/**"],
  })) {
    count++;
    const source = await readFile(join(root, path), "utf8");
    const lines = source.split("\n").length - Number(source.endsWith("\n"));
    if (lines > 300) oversized.push(`${path}: ${lines} lines`);
  }
  expect(count, "No test files found").toBeGreaterThan(0);
  expect(oversized, oversized.join("\n")).toEqual([]);
});
