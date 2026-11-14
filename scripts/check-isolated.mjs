import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const listing = spawnSync("git", ["ls-files", "-co", "--exclude-standard", "-z", "--", "."], {
  cwd: root,
  encoding: "utf8",
});
if (listing.error) throw listing.error;
if (listing.status !== 0) {
  process.stderr.write(listing.stderr);
  process.exit(listing.status ?? 1);
}

const isolated = mkdtempSync(join(tmpdir(), "react-decks-isolated-"));
let status = 0;
try {
  for (const file of new Set(listing.stdout.split("\0").filter(Boolean))) {
    const destination = join(isolated, relative(root, resolve(root, file)));
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(root, file), destination);
  }
  for (const args of [
    ["install", "--frozen-lockfile"],
    ["run", "check"],
  ]) {
    const result = spawnSync("bun", args, { cwd: isolated, stdio: "inherit" });
    if (result.error) throw result.error;
    status = result.status ?? 1;
    if (status !== 0) break;
  }
} finally {
  rmSync(isolated, { recursive: true, force: true });
}
process.exit(status);
