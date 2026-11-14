import { chmod, cp, readdir, rm } from "node:fs/promises";
import { basename } from "node:path";
import { build } from "tsdown";

await build({
  entry: ["src/index.ts", "src/motion.ts", "src/kit.ts", "src/node.ts", "src/cli.ts"],
  format: "esm",
  fixedExtension: false,
  target: "node22",
  dts: true,
  deps: {
    alwaysBundle: [/^@react-decks\//],
    neverBundle: (id) =>
      id.endsWith(".css") ||
      (!id.startsWith(".") && !id.startsWith("/") && !id.startsWith("@react-decks/")),
  },
  outputOptions: {
    codeSplitting: true,
    paths: (id) =>
      id.endsWith(".css") && (id.startsWith(".") || id.startsWith("/")) ? `./${basename(id)}` : id,
  },
});

// JS chunks retain relative CSS imports; ship those files at the same level.
for (const name of ["runtime", "motion"]) {
  const source = new URL(`../${name}/src/`, import.meta.url);
  for (const file of await readdir(source, { recursive: true })) {
    if (file.endsWith(".css"))
      await cp(new URL(file, source), new URL(`dist/${basename(file)}`, import.meta.url));
  }
}
await cp(new URL("../kit/src/styles/", import.meta.url), new URL("dist/kit/", import.meta.url), {
  recursive: true,
});
await cp(
  new URL("dist/kit/index.css", import.meta.url),
  new URL("dist/kit/styles.css", import.meta.url),
);
await rm(new URL("docs/", import.meta.url), { recursive: true, force: true });
await cp(new URL("../../docs/guide/", import.meta.url), new URL("docs/", import.meta.url), {
  recursive: true,
});
await chmod(new URL("dist/cli.js", import.meta.url), 0o755);
