// Prepare a release of @steamfield/decks without publishing it.
//
//   bun run release:prepare
//
// Runs the gate, the isolated gate and the tarball test, stamps the plugin manifest with the
// package version (so `decks init`'s marketplace ref and the plugin agree), builds the package
// and packs it into dist/release/. It stops at the first failure. Publishing, tagging and
// pushing stay with a person: the script prints those commands and runs none of them.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "packages/decks/package.json"), "utf8"));
const step = (label, command, args, cwd = root) => {
  console.log(`release: ${label}`);
  execFileSync(command, args, { cwd, stdio: "inherit" });
};

// The tag must name exactly the tree the gates passed on, with the plugin at the package's
// version (decks init pins the marketplace to that tag). Check both before spending the gates.
const dirty = execFileSync("git", ["status", "--porcelain"], {
  cwd: root,
  encoding: "utf8",
}).trim();
if (dirty)
  throw new Error(`release: the working tree is not clean; commit or stash first:\n${dirty}`);
const manifestPath = join(root, "plugins/decks/.claude-plugin/plugin.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
if (manifest.version !== pkg.version) {
  manifest.version = pkg.version;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  throw new Error(
    `release: plugins/decks/.claude-plugin/plugin.json did not match the package version; it now says ${pkg.version}. Commit it and run release:prepare again.`,
  );
}

// check ends with the tarball test, so it is not run separately.
step("gate", "bun", ["run", "check"]);
step("isolated gate", "bun", ["run", "check:isolated"]);

step("build", "bun", ["run", "build"], join(root, "packages/decks"));
const out = join(root, "dist/release");
mkdirSync(out, { recursive: true });
step("pack", "npm", ["pack", "--pack-destination", out], join(root, "packages/decks"));

const tarball = join(out, `steamfield-decks-${pkg.version}.tgz`);
const tag = pkg.version.includes("-") ? pkg.version.split("-")[1].split(".")[0] : "latest";
console.log(`
release: ready. To publish, from a clean main with this commit:

  npm publish ${tarball} --tag ${tag} --access public
  git tag v${pkg.version}
  git push origin main v${pkg.version}
`);
