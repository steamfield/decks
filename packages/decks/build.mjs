import { chmod, cp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { build } from "tsdown";

const config = {
  entry: ["./src/index.ts", "./src/motion.ts", "./src/kit.ts", "./src/node.ts", "./src/cli.ts"],
  format: "esm",
  fixedExtension: false,
  target: "node22",
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
};

await build({ ...config, dts: false });
// Declaration-only tree shaking drops CSS side effects without dropping runtime styles.
await build({ ...config, clean: false, dts: { dtsOnly: true } });

// JS chunks retain relative CSS imports; ship those files at the same level.
// The kit's global stylesheets ship whole under dist/kit/ below; its CSS Modules are imported
// from JS like runtime's and motion's.
for (const name of ["runtime", "motion", "kit"]) {
  const source = new URL(`../${name}/src/`, import.meta.url);
  for (const file of await readdir(source, { recursive: true })) {
    if (name === "kit" ? file.endsWith(".module.css") : file.endsWith(".css"))
      await cp(new URL(file, source), new URL(`dist/${basename(file)}`, import.meta.url));
  }
}
await cp(new URL("../kit/src/", import.meta.url), new URL("dist/kit/", import.meta.url), {
  recursive: true,
  filter: async (source) => (await stat(source)).isDirectory() || /\.(css|woff2)$/.test(source),
});
await writeFile(new URL("dist/kit/styles.css", import.meta.url), '@import "./styles/index.css";\n');
await cp(
  new URL("../node/templates/", import.meta.url),
  new URL("dist/templates/", import.meta.url),
  { recursive: true },
);
await cp(new URL("../node/lint/", import.meta.url), new URL("dist/lint/", import.meta.url), {
  recursive: true,
});
await cp(new URL("../node/term/", import.meta.url), new URL("dist/term/", import.meta.url), {
  recursive: true,
});
await cp(
  new URL("../../plugins/decks/skills/", import.meta.url),
  new URL("dist/plugin/skills/", import.meta.url),
  { recursive: true },
);
await rm(new URL("docs/", import.meta.url), { recursive: true, force: true });
await cp(new URL("../../docs/guide/", import.meta.url), new URL("docs/", import.meta.url), {
  recursive: true,
});
await cp(new URL("../../LICENSE", import.meta.url), new URL("LICENSE", import.meta.url));
await chmod(new URL("dist/cli.js", import.meta.url), 0o755);
