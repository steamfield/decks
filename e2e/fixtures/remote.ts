import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stripVTControlCharacters } from "node:util";
import { type Browser, expect, type Page } from "@playwright/test";
import { cliProcess } from "../../packages/node/src/cli/cli-process.test-support";
import { test as base } from "./deck.fixture";
import { settled } from "./deck-driver";

async function startRemote(browser: Browser, dir: string, mode?: "clock" | "live-term") {
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
    expect((await fetch(remoteURL)).status).toBe(200);
    // Warm the cold dev server (dependency optimizer, first transforms) as deckServer does,
    // so a test's first page load is not racing it.
    const warm = await browser.newPage();
    try {
      await warm.goto(url);
      await warm.waitForFunction(() => window.__deck !== undefined);
      await settled(warm);
    } finally {
      await warm.close();
    }
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

type RemoteServer = Awaited<ReturnType<typeof startRemote>>;

export const test = base.extend<
  {
    remotePage: Page;
    remoteServer: (mode: "clock" | "live-term") => Promise<RemoteServer>;
  },
  { remote: RemoteServer }
>({
  // One default-mode server per worker: each test closes its windows, and the relay takes its
  // position from the first window that reports after that. Only the clock test reads the timer.
  remote: [
    async ({ browser, browserName }, use) => {
      const dir = await mkdtemp(join(tmpdir(), `deck-remote-${browserName}-`));
      try {
        const server = await startRemote(browser, dir);
        try {
          await use(server);
        } finally {
          await server.close();
        }
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
    { scope: "worker" },
  ],
  remotePage: async ({ browser }, use) => {
    const device = await browser.newContext();
    try {
      await use(await device.newPage());
    } finally {
      await device.close();
    }
  },
  remoteServer: async ({ browser, browserName }, use) => {
    const dir = await mkdtemp(join(tmpdir(), `deck-remote-${browserName}-`));
    let server: RemoteServer | undefined;
    try {
      await use(async (mode) => {
        server = await startRemote(browser, dir, mode);
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
