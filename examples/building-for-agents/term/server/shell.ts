import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { PtySpawn } from "./sessions";

export function shellSpawn(command: readonly string[]): PtySpawn {
  return ({ rows, cols, cwd, env }) => {
    const child = spawn(
      "python3",
      [
        fileURLToPath(new URL("./shell_pty.py", import.meta.url)),
        String(rows),
        String(cols),
        ...command,
      ],
      { cwd, env, stdio: ["pipe", "pipe", "pipe"] },
    );
    let failure = "";
    let ended: string | undefined;
    let receiveExit: ((reason: string) => void) | undefined;
    const exit = (reason: string) => {
      if (ended !== undefined) return;
      ended = reason;
      receiveExit?.(reason);
    };
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      failure = (failure + chunk).slice(-1024);
    });
    child.on("error", (error) => exit(`Shell could not start: ${error.message}`));
    child.stdin.on("error", (error) => exit(`Shell input failed: ${error.message}`));
    child.on("close", (code, signal) =>
      exit(failure.trim() || `Shell exited (${signal ?? code ?? "unknown status"})`),
    );
    return {
      write(data) {
        child.stdin.write(data);
      },
      // Closing the pipe hangs up the pty and lets the helper reap the shell.
      kill() {
        child.stdin.end();
      },
      onData(receive) {
        child.stdout.on("data", receive);
      },
      onExit(receive) {
        receiveExit = receive;
        if (ended !== undefined) receive(ended);
      },
    };
  };
}
