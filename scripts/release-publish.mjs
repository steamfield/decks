// Pack and publish @steamfield/decks for the release workflow.
//
//   node scripts/release-publish.mjs pack <package-dir> <artifact-dir>
//   node scripts/release-publish.mjs publish <artifact-dir>
//
// `pack` writes the tarball and release.json (name, version, filename, integrity) into the
// artifact dir. `publish` reads them back, so a rerun publishes the bytes that were built. It is
// idempotent: a version already on npm with the same integrity is skipped, a different integrity
// fails, and nothing is ever republished. Auth is npm trusted publishing (OIDC): no token.
//
// To release more than one package, make release.json a list and publish dependencies first.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

// What each npm failure code means in this pipeline, shown under the failure so a red run explains itself.
const hints = {
  EOTP: "npm asked for a one-time password, so this was not an OIDC publish. Check the package's Trusted Publisher (steamfield/decks, release.yml) and that no NODE_AUTH_TOKEN is set.",
  ENEEDAUTH:
    "npm had no credentials. Trusted publishing needs `id-token: write` on the job and a Trusted Publisher on the package.",
  E401: "npm rejected the credentials. Check the package's Trusted Publisher (steamfield/decks, release.yml).",
  E403: "npm refused this publish: the package's Trusted Publisher is missing or does not match this repository and workflow, or the version already exists.",
  E404: "npm returned 404 on publish. Either the package was never published by hand (a Trusted Publisher can only be added to an existing package, so the first release is a manual bootstrap), the scope does not exist, or the OIDC login failed: check the Trusted Publisher is steamfield/decks, release.yml, no environment, and that the runner npm is 11.5.1 or newer.",
  E422: "npm rejected the provenance. Provenance needs a public repository, a `repository` field in package.json and `id-token: write`.",
};

// Run npm and fail with the command, npm's own error lines and a hint, not a dump of the child process.
// stdout is kept on the error because `npm view --json` reports registry errors there.
function npm(args) {
  try {
    return execFileSync("npm", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const stderr = String(error.stderr ?? "");
    const code = /^npm error code (\w+)/m.exec(stderr)?.[1];
    const lines = stderr
      .split("\n")
      .filter(
        (line) =>
          line.startsWith("npm error") &&
          !line.startsWith("npm error code") &&
          !line.includes("A complete log"),
      )
      .map((line) => line.replace(/^npm error ?/, "").trim())
      .filter(Boolean)
      .slice(0, 6);
    const target = args
      .map((arg) => (arg.endsWith(".tgz") ? arg.split("/").pop() : arg))
      .slice(0, 2)
      .join(" ");
    const failure = new Error(
      [
        `npm ${target} failed${code ? ` (${code})` : ""}`,
        ...lines.map((line) => `  ${line}`),
        ...(hints[code] ? [`Hint: ${hints[code]}`] : []),
      ].join("\n"),
      { cause: error },
    );
    failure.stdout = error.stdout;
    failure.npmCode = code;
    throw failure;
  }
}

function pack(packageDir, artifactDir) {
  mkdirSync(artifactDir, { recursive: true });
  const [packed] = JSON.parse(
    npm(["pack", resolve(packageDir), "--json", "--pack-destination", resolve(artifactDir)]),
  );
  const { name, version, filename, integrity } = packed;
  writeFileSync(
    join(artifactDir, "release.json"),
    JSON.stringify({ name, version, filename, integrity }),
  );
}

function publishedIntegrity(spec) {
  let output;
  try {
    output = npm(["view", spec, "dist.integrity", "--json"]);
  } catch (error) {
    // Only an explicit registry 404 means the version can be published.
    let diagnostic;
    try {
      diagnostic = JSON.parse(error.stdout);
    } catch {
      throw error;
    }
    if (diagnostic.error?.code === "E404") return null;
    throw error;
  }
  return JSON.parse(output);
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// npm reports a publish well before the registry serves it, usually within 3-5 minutes.
function confirmPublished(release, spec) {
  const delay = Number(process.env.RELEASE_CONFIRM_DELAY_MS ?? 120000);
  const interval = Number(process.env.RELEASE_CONFIRM_INTERVAL_MS ?? 15000);
  const attempts = Number(process.env.RELEASE_CONFIRM_ATTEMPTS ?? 20);
  console.log(`Waiting for the registry to show ${spec}`);
  sleep(delay);
  for (let attempt = 1; ; attempt++) {
    const found = publishedIntegrity(spec);
    if (found === release.integrity) return console.log(`Confirmed ${spec}`);
    if (found !== null)
      throw new Error(`${spec} is on npm with different contents than the build.`);
    if (attempt >= attempts)
      throw new Error(
        `Could not confirm ${spec} on the registry after ${Math.round((delay + attempts * interval) / 1000)}s. npm reported the publish, so rerun the job: it skips a version already published.`,
      );
    sleep(interval);
  }
}

function publish(artifactDir) {
  const release = JSON.parse(readFileSync(join(artifactDir, "release.json"), "utf8"));
  const spec = `${release.name}@${release.version}`;
  // 1.0.0-rc.0 goes under the "rc" dist-tag so `latest` is untouched.
  const tag = release.version.includes("-")
    ? release.version.split("-")[1].split(".")[0]
    : "latest";
  let status = `${spec} was not published.`;
  try {
    const existing = publishedIntegrity(spec);
    if (existing === null) {
      console.log(`Publishing ${spec}`);
      status = `${spec} was not published.`;
      try {
        process.stdout.write(
          npm([
            "publish",
            resolve(artifactDir, release.filename),
            "--tag",
            tag,
            "--provenance",
            "--access",
            "public",
          ]),
        );
      } catch (error) {
        // An earlier run published this version and the registry is not serving it yet.
        if (error.npmCode !== "E409") throw error;
        console.log(`${spec} was already published; waiting for the registry.`);
      }
      status = `${spec} was published but the registry does not show it yet.`;
      confirmPublished(release, spec);
    } else if (existing !== release.integrity) {
      throw new Error(
        `${spec} is already on npm with different contents. Never republish a version: bump the patch and tag again.`,
      );
    } else console.log(`Verified ${spec}; skipping publish.`);
  } catch (error) {
    throw new Error(
      `${error.message}\n${status}\nAfter fixing the cause, rerun the failed job: it skips a version already on npm.`,
      { cause: error },
    );
  }
}

// One readable line group on stderr plus a GitHub annotation, instead of Node's stack trace.
function report(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (process.env.GITHUB_ACTIONS)
    console.error(`::error title=Release publish failed::${message.replace(/\n/g, "%0A")}`);
  console.error(`release: ${message}`);
  process.exitCode = 1;
}

const [command, first, second] = process.argv.slice(2);
try {
  if (command === "pack" && first && second) pack(first, second);
  else if (command === "publish" && first && !second) publish(first);
  else
    throw new Error(
      "Usage: release-publish.mjs pack <package-dir> <artifact-dir> | publish <artifact-dir>",
    );
} catch (error) {
  report(error);
}
