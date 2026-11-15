import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { expect, it } from "vitest";

const exec = promisify(execFile);
const release = { name: "@steamfield/decks", version: "1.2.3", filename: "decks.tgz" };

type Mode = "fresh" | "published" | "mismatch" | "registry-error" | "publish-fails" | "unconfirmed";

// The publish step of the workflow, run as the workflow runs it, against a fake `npm` on PATH.
async function runPublish(mode: Mode, version = release.version) {
  await mkdir(resolve(".tmp"), { recursive: true });
  const root = await realpath(await mkdtemp(resolve(".tmp/release-publish-")));
  await mkdir(`${root}/bin`);
  await mkdir(`${root}/dist/release`, { recursive: true });
  const entry = { ...release, version, integrity: "sha512-built" };
  await writeFile(`${root}/dist/release/release.json`, JSON.stringify(entry));
  const spec = `${entry.name}@${version}`;
  await writeFile(
    `${root}/registry.json`,
    JSON.stringify(
      mode === "published" || mode === "mismatch"
        ? { [spec]: mode === "mismatch" ? "sha512-other" : entry.integrity }
        : {},
    ),
  );
  await writeFile(`${root}/calls.jsonl`, "");
  await writeFile(
    `${root}/bin/npm`,
    `#!${process.execPath}
import fs from "node:fs";
const root = ${JSON.stringify(root)};
const mode = ${JSON.stringify(mode)};
const args = process.argv.slice(2);
fs.appendFileSync(root + "/calls.jsonl", JSON.stringify(args) + "\\n");
const registry = JSON.parse(fs.readFileSync(root + "/registry.json"));
if (args[0] === "view") {
  if (mode === "registry-error") { console.log(JSON.stringify({error:{code:"E503"}})); console.error("npm error code E503"); process.exit(1); }
  if (!(args[1] in registry)) { console.log(JSON.stringify({error:{code:"E404"}})); console.error("npm error code E404"); process.exit(1); }
  console.log(JSON.stringify(registry[args[1]]));
} else if (args[0] === "publish") {
  if (mode === "publish-fails") {
    console.error("npm error code E403");
    console.error("npm error 403 Forbidden - PUT https://registry.npmjs.org/@steamfield%2fdecks");
    process.exit(1);
  }
  if (mode !== "unconfirmed") registry[${JSON.stringify(spec)}] = "sha512-built";
  fs.writeFileSync(root + "/registry.json", JSON.stringify(registry));
} else process.exit(2);
`,
    { mode: 0o755 },
  );

  const workflow = await readFile(".github/workflows/release.yml", "utf8");
  const publishStep = workflow
    .split("      - name: Publish to npm")[1]
    ?.split("        run: |\n")[1]
    ?.split("\n\n")[0];
  if (!publishStep) throw new Error("Release workflow has no `Publish to npm` step");
  // The step's `run:` block, un-indented, with the script path pointing at this checkout.
  const script = publishStep
    .split("\n")
    .map((line) => line.replace(/^ {10}/, ""))
    .join("\n")
    .replace("scripts/release-publish.mjs", resolve("scripts/release-publish.mjs"));

  let status = 0;
  let stderr = "";
  let stdout = "";
  try {
    ({ stdout } = await exec("/bin/bash", ["-e", "-c", script], {
      cwd: root,
      env: {
        HOME: root,
        GITHUB_ACTIONS: "true",
        PATH: `${root}/bin:${dirname(process.execPath)}`,
        RELEASE_CONFIRM_DELAY_MS: "0",
        RELEASE_CONFIRM_ATTEMPTS: "3",
        RELEASE_CONFIRM_INTERVAL_MS: "0",
      },
    }));
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || typeof error.code !== "number")
      throw error;
    status = error.code;
    stderr = "stderr" in error ? String(error.stderr) : "";
  }
  const calls = (await readFile(`${root}/calls.jsonl`, "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as string[]);
  const published = calls.filter((call) => call[0] === "publish");
  return { root, status, stdout, stderr, published };
}

it("publishes a version the registry does not have, with provenance, and confirms it", async () => {
  const { root, status, stdout, published } = await runPublish("fresh");
  expect(status).toBe(0);
  expect(published).toEqual([
    [
      "publish",
      `${root}/dist/release/decks.tgz`,
      "--tag",
      "latest",
      "--provenance",
      "--access",
      "public",
    ],
  ]);
  expect(stdout).toContain("Confirmed @steamfield/decks@1.2.3");
});

it("publishes a prerelease under its own dist-tag so latest is untouched", async () => {
  const { published } = await runPublish("fresh", "1.0.0-rc.0");
  expect(published[0]?.slice(2, 4)).toEqual(["--tag", "rc"]);
});

it("skips a version already on npm with the same integrity", async () => {
  const { status, stdout, published } = await runPublish("published");
  expect(status).toBe(0);
  expect(published).toEqual([]);
  expect(stdout).toContain("Verified @steamfield/decks@1.2.3; skipping publish.");
});

it("fails without publishing when the registry holds different contents for the version", async () => {
  const { status, stderr, published } = await runPublish("mismatch");
  expect(status).toBe(1);
  expect(published).toEqual([]);
  expect(stderr).toContain("already on npm with different contents");
  expect(stderr).toContain("Never republish a version");
});

it("fails without publishing when the registry answers with something other than a 404", async () => {
  const { status, stderr, published } = await runPublish("registry-error");
  expect(status).toBe(1);
  expect(published).toEqual([]);
  expect(stderr).toContain("npm view @steamfield/decks@1.2.3 failed (E503)");
});

it("explains a failed publish in plain text with the npm error, a hint and what is on npm", async () => {
  const { status, stderr } = await runPublish("publish-fails");
  expect(status).toBe(1);
  expect(stderr).toContain("release: npm publish decks.tgz failed (E403)");
  expect(stderr).toContain("403 Forbidden");
  expect(stderr).toContain("Hint: npm refused this publish: the package's Trusted Publisher");
  expect(stderr).toContain("@steamfield/decks@1.2.3 was not published.");
  expect(stderr).toContain("rerun the failed job");
  expect(stderr).not.toContain("node:internal");
});

it("annotates the failure for GitHub and says the registry has not shown the version yet", async () => {
  const { status, stderr } = await runPublish("unconfirmed");
  expect(status).toBe(1);
  expect(stderr).toContain("::error title=Release publish failed::");
  expect(stderr).toContain("Could not confirm @steamfield/decks@1.2.3");
  expect(stderr).toContain("was published but the registry does not show it yet");
  expect(stderr).not.toContain("node:internal");
});

it("packs the package and records the integrity of the exact tarball", async () => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const root = await realpath(await mkdtemp(resolve(".tmp/release-pack-")));
  await mkdir(`${root}/pkg`);
  await writeFile(
    `${root}/pkg/package.json`,
    JSON.stringify({ name: "@steamfield/decks", version: "1.2.3" }),
  );
  await writeFile(`${root}/pkg/LICENSE`, "Test fixture");
  await exec(
    process.execPath,
    [resolve("scripts/release-publish.mjs"), "pack", `${root}/pkg`, `${root}/out`],
    {
      env: { HOME: root, PATH: process.env.PATH, npm_config_cache: `${root}/cache` },
    },
  );
  const recorded = JSON.parse(await readFile(`${root}/out/release.json`, "utf8"));
  const bytes = await readFile(`${root}/out/${recorded.filename}`);
  expect(recorded.name).toBe("@steamfield/decks");
  expect(recorded.version).toBe("1.2.3");
  expect(recorded.integrity).toBe(`sha512-${createHash("sha512").update(bytes).digest("base64")}`);
});
