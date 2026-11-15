import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { expect, it } from "vitest";
import {
  pathWith,
  repoRoot,
  runStepScript,
  tempDir,
  workflowStepScript,
} from "./release-workflow.test-support";

const exec = promisify(execFile);
const releaseScript = resolve(repoRoot, "scripts/release-publish.mjs");
const VIEW_ATTEMPTS = 3;
const release = { name: "@steamfield/decks", version: "1.2.3", filename: "decks.tgz" };

type Mode =
  | "fresh"
  | "published"
  | "mismatch"
  | "registry-error"
  | "publish-fails"
  | "unconfirmed"
  | "flaky"
  | "auth-error"
  | "hang";

// The publish step of the workflow, run as the workflow runs it, against a fake `npm` on PATH.
async function runPublish(mode: Mode, version = release.version, env: Record<string, string> = {}) {
  const root = await tempDir("release-publish-");
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
const fail = (code) => { console.log(JSON.stringify({error:{code}})); console.error("npm error code " + code); process.exit(1); };
if (args[0] === "view") {
  const path = root + "/views";
  const views = fs.existsSync(path) ? Number(fs.readFileSync(path, "utf8")) : 0;
  fs.writeFileSync(path, String(views + 1));
  if (mode === "hang") await new Promise(() => setInterval(() => {}, 1000));
  if (mode === "auth-error") fail("E401");
  if (mode === "registry-error" || (mode === "flaky" && views < 2)) fail("E503");
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

  // The step's `run:` script, with the script path pointing at this checkout.
  const script = (await workflowStepScript("Publish to npm")).replace(
    "scripts/release-publish.mjs",
    releaseScript,
  );
  const { status, stdout, stderr } = await runStepScript(script, {
    cwd: root,
    env: {
      HOME: root,
      GITHUB_ACTIONS: "true",
      PATH: pathWith(`${root}/bin`),
      RELEASE_CONFIRM_DELAY_MS: "0",
      RELEASE_CONFIRM_ATTEMPTS: "3",
      RELEASE_CONFIRM_INTERVAL_MS: "0",
      RELEASE_RETRY_BASE_MS: "0",
      RELEASE_VIEW_ATTEMPTS: String(VIEW_ATTEMPTS),
      ...env,
    },
  });
  const calls = (await readFile(`${root}/calls.jsonl`, "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as string[]);
  const published = calls.filter((call) => call[0] === "publish");
  const views = Number(await readFile(`${root}/views`, "utf8").catch(() => "0"));
  return { root, status, stdout, stderr, published, views };
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

it("retries a registry error that keeps coming and then fails naming how many attempts it made", async () => {
  const { status, stderr, published, views } = await runPublish("registry-error");
  expect(status).toBe(1);
  expect(published).toEqual([]);
  expect(views).toBe(VIEW_ATTEMPTS);
  expect(stderr).toContain("npm view @steamfield/decks@1.2.3 failed (E503)");
  expect(stderr).toContain(`gave up after ${VIEW_ATTEMPTS} attempts`);
});

it("retries a registry error that clears and then publishes", async () => {
  const { status, stdout, published } = await runPublish("flaky");
  expect(status).toBe(0);
  expect(stdout).toContain("failed with E503; retrying");
  expect(published).toHaveLength(1);
});

it("does not retry an auth error", async () => {
  const { status, stderr, views } = await runPublish("auth-error");
  expect(status).toBe(1);
  expect(views).toBe(1);
  expect(stderr).toContain("(E401)");
});

it("fails a registry call that hangs instead of waiting for the job timeout", async () => {
  const { status, stderr } = await runPublish("hang", release.version, {
    RELEASE_VIEW_TIMEOUT_MS: "1000",
    RELEASE_VIEW_ATTEMPTS: "1",
  });
  expect(status).toBe(1);
  expect(stderr).toContain("npm view timed out after 1s");
  expect(stderr).not.toContain("node:internal");
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

it("warns, and does not fail, when the registry has not shown a published version yet", async () => {
  const { status, stdout, stderr } = await runPublish("unconfirmed");
  expect(status).toBe(0);
  expect(stdout).toContain("::warning title=Release not yet visible on npm::");
  expect(stdout).toContain("npm accepted @steamfield/decks@1.2.3");
  expect(stderr).not.toContain("node:internal");
});

it("annotates a failure for GitHub", async () => {
  const { status, stderr } = await runPublish("publish-fails");
  expect(status).toBe(1);
  expect(stderr).toContain("::error title=Release publish failed::");
});

it("packs the package and records the integrity of the exact tarball", async () => {
  const root = await tempDir("release-pack-");
  await mkdir(`${root}/pkg`);
  await writeFile(
    `${root}/pkg/package.json`,
    JSON.stringify({ name: "@steamfield/decks", version: "1.2.3" }),
  );
  await writeFile(`${root}/pkg/LICENSE`, "Test fixture");
  await exec(process.execPath, [releaseScript, "pack", `${root}/pkg`, `${root}/out`], {
    env: { HOME: root, PATH: process.env.PATH, npm_config_cache: `${root}/cache` },
  });
  const recorded = JSON.parse(await readFile(`${root}/out/release.json`, "utf8"));
  const bytes = await readFile(`${root}/out/${recorded.filename}`);
  expect(recorded.name).toBe("@steamfield/decks");
  expect(recorded.version).toBe("1.2.3");
  expect(recorded.integrity).toBe(`sha512-${createHash("sha512").update(bytes).digest("base64")}`);
});
