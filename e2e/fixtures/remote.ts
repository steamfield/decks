import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stripVTControlCharacters } from "node:util";
import { expect, type Page } from "@playwright/test";
import { cliProcess } from "../../packages/node/src/cli/cli-process.test-support";
import { test as base } from "./deck.fixture";

async function startRemote(dir: string, mode?: "clock" | "live-term") {
  const clockStep = join(dir, "advance-clock");
  // The relay and remote have separate monotonic clocks. Pin Node's only for the timer test.
  const clock = `
    import { existsSync } from "node:fs";
    const start = performance.now();
    Object.defineProperty(performance, "now", {
      value: () => start + (existsSync(${JSON.stringify(clockStep)}) ? 3000 : 0),
    });
  `;
  const server = cliProcess(
    process.execPath,
    [
      "--conditions=@steamfield/decks/source",
      "--import",
      "tsx",
      ...(mode === "clock"
        ? ["--import", `data:text/javascript,${encodeURIComponent(clock)}`]
        : []),
      "packages/node/src/cli/cli.ts",
      "dev",
      mode === "live-term" ? "examples/terminal" : "examples/basic",
      "--remote",
      "--port",
      "0",
      "--remote-port",
      "0",
      ...(mode === "live-term" ? ["--live-term"] : []),
    ],
    { env: { ...process.env, TMPDIR: dir } },
  );
  const close = async () => {
    // The CLI uses SIGINT to close both servers and their temporary files.
    if (server.child.exitCode === null && server.child.signalCode === null)
      server.child.kill("SIGINT");
    await server.exit;
  };
  try {
    const url = await server.url();
    const printedRemoteURL = () =>
      stripVTControlCharacters(server.output().stdout)
        .split("Remote presenter:\n")[1]
        ?.match(/^http:\/\/\S+\/\?token=\S+$/m)?.[0];
    await expect.poll(printedRemoteURL, { message: "CLI prints the remote URL" }).toBeDefined();
    const remoteURL = printedRemoteURL();
    if (!remoteURL) throw new Error("Missing remote URL in decks dev output");
    expect((await fetch(remoteURL, { signal: AbortSignal.timeout(5000) })).status).toBe(200);
    return {
      url,
      remoteURL,
      close,
      advanceClock: () => writeFile(clockStep, ""),
      async executions() {
        const terminal = (await readdir(dir)).find((name) => name.startsWith("deck-term-"));
        if (!terminal) throw new Error("Missing live terminal directory");
        return readFile(join(dir, terminal, "executions"), "utf8").catch((cause: unknown) => {
          if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return "";
          throw cause;
        });
      },
    };
  } catch (cause) {
    await close();
    throw cause;
  }
}

export const test = base.extend<{
  remotePage: Page;
  remoteServer: (mode?: "clock" | "live-term") => ReturnType<typeof startRemote>;
}>({
  remotePage: async ({ browser }, use) => {
    const device = await browser.newContext();
    try {
      await use(await device.newPage());
    } finally {
      await device.close();
    }
  },
  remoteServer: async ({ browserName }, use) => {
    const dir = await mkdtemp(join(tmpdir(), `deck-remote-${browserName}-`));
    let server: Awaited<ReturnType<typeof startRemote>> | undefined;
    try {
      await use(async (mode) => {
        server = await startRemote(dir, mode);
        return server;
      });
    } finally {
      try {
        await server?.close();
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }
  },
});
