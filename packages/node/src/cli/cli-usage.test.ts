import { createServer } from "node:net";
import { expect, it, onTestFinished } from "vitest";
import { cli, fixture, waitForWatcher } from "../dev/server.test-support";

it("accepts boolean negation while serving a deck", async () => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, ["dev", ".", "--no-open", "--port", "0"]);
  await waitForWatcher(() =>
    expect(process.output().stdout, process.output().stderr).toContain("http:"),
  );
  expect(process.output().stderr).toBe("");
});

it.each([
  [["--port"], "--port needs a value. Pass --port <n>, a whole number from 0 to 65535."],
  [["--open=false"], "--open does not take a value. Use --open or --no-open."],
  [["extra"], 'unexpected argument "extra". Pass one deck alias or directory.'],
])("explains invalid dev arguments %s", async (args, message) => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, ["dev", ".", ...args]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(`decks dev: ${message}\n`);
});

it("rejects an unknown build option with the command's options", async () => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, ["build", ".", "--bogus", "1"]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    "decks build: unknown option --bogus. Options: --out, --base.\n",
  );
});

it("keeps an explicit dev port strict without an EADDRINUSE stack", async () => {
  const occupied = createServer();
  await new Promise<void>((resolve) => occupied.listen(0, "localhost", resolve));
  onTestFinished(
    () =>
      new Promise<void>((resolve, reject) =>
        occupied.close((error) => (error ? reject(error) : resolve())),
      ),
  );
  const address = occupied.address();
  if (!address || typeof address === "string") throw new Error("No TCP port");
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, ["dev", ".", "--port", String(address.port)]);
  expect((await process.exit)[0]).toBe(1);
  expect(process.output().stderr).toBe(
    `decks dev: port ${address.port} is already in use. Stop what is using it or pass a different --port.\n`,
  );
  expect(process.output().stdout).not.toContain("http:");
});

it.each<{ args: string[]; code: number; channel: "stderr" | "stdout" }>([
  { args: [], code: 1, channel: "stderr" },
  { args: ["wat"], code: 1, channel: "stdout" },
])("prints top-level usage for $args", async ({ args, code, channel }) => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, args);
  expect((await process.exit)[0]).toBe(code);
  const usage = process.output()[channel];
  expect(usage).toContain("USAGE decks");
  expect(usage).not.toMatch(/cli\.ts|undefined/);
  expect(usage).toContain("Serve a deck");
  expect(usage).toContain("Build a static deck");
});

it.each([
  ["build", "Output directory", "Base URL"],
  ["dev", "Port to listen on", "Open the deck"],
])("prints %s options in its help", async (command, first, second) => {
  const { dir } = await fixture(onTestFinished);
  const process = cli(dir, [command, "--help"]);
  expect((await process.exit)[0]).toBe(0);
  expect(process.output().stdout).toContain(`USAGE decks ${command}`);
  expect(process.output().stdout).not.toMatch(/cli\.ts|undefined/);
  expect(process.output().stdout).toContain(first);
  expect(process.output().stdout).toContain(second);
});
