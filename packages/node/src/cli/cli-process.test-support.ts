import { type SpawnOptionsWithoutStdio, spawn } from "node:child_process";
import { once } from "node:events";
import { stripVTControlCharacters } from "node:util";

export function cliProcess(command: string, args: string[], options: SpawnOptionsWithoutStdio) {
  const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (data) => {
    stdout += String(data);
  });
  child.stderr.on("data", (data) => {
    stderr += String(data);
  });
  const exit = once(child, "close");
  return {
    child,
    exit,
    output: () => ({ stdout, stderr }),
    async url() {
      const signal = AbortSignal.timeout(30_000);
      let url = stripVTControlCharacters(stdout).match(/http:\/\/[^\s]+/)?.[0];
      try {
        while (!url) {
          await Promise.race([
            once(child.stdout, "data", { signal }),
            exit.then(() => {
              throw new Error(`${command} exited: ${stdout}${stderr}`);
            }),
          ]);
          url = stripVTControlCharacters(stdout).match(/http:\/\/[^\s]+/)?.[0];
        }
        const response = await fetch(url, { signal });
        if (response.status !== 200) throw new Error(`${url} returned HTTP ${response.status}`);
      } catch (cause) {
        throw new Error(`${command} did not provide a URL serving HTTP 200: ${stdout}${stderr}`, {
          cause,
        });
      }
      return url;
    },
    async close() {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
      await exit;
    },
  };
}
