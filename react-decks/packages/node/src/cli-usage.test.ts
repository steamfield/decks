import { createServer } from "node:net";
import { expect, it, onTestFinished } from "vitest";
import { cli, fixture, waitForWatcher } from "./deck.test-support";

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
  if (args[0] === "extra") {
    await waitForWatcher(() => expect(process.output().stderr).not.toBe(""));
  }
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

it.each([[], ["build", "--help"], ["dev", "--help"], ["wat"]].map((args) => ({ args })))(
  "prints named usage for $args",
  async ({ args }) => {
    const { dir } = await fixture(onTestFinished);
    const process = cli(dir, args);
    expect((await process.exit)[0]).toBe(args[0] === "wat" ? 1 : 0);
    expect(process.output().stdout).toContain("USAGE decks");
    expect(process.output().stdout).not.toMatch(/cli\.ts|undefined/);
    if (args[0] === "build") {
      expect(process.output().stdout).toContain("Output directory");
      expect(process.output().stdout).toContain("Base URL");
    } else if (args[0] === "dev") {
      expect(process.output().stdout).toContain("Port to listen on");
      expect(process.output().stdout).toContain("Open the deck");
    } else {
      expect(process.output().stdout).toContain("Serve a deck");
      expect(process.output().stdout).toContain("Build a static deck");
    }
  },
);
