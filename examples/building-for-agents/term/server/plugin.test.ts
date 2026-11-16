// Run by hand on macOS with python3: DECKS_LIVE_TERM=1 bun run test examples/building-for-agents/term/server/plugin.test.ts

import { createLogger, createServer } from "vite";
import { expect, test, vi } from "vitest";
import { TERM_ATTACH, TERM_DATA, TERM_READY, TERM_STATE, TERM_STEP } from "../protocol";
import { liveTerm } from "./plugin";

test.each([
  { enabled: false, host: "127.0.0.1" },
  { enabled: true, host: "0.0.0.0" },
])(
  "attach is unanswered when enabled is $enabled and bound host is $host",
  async ({ enabled, host }) => {
    const warnings: string[] = [];
    const logger = createLogger("silent");
    logger.warn = (message) => {
      warnings.push(message);
    };
    const server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      customLogger: logger,
      server: { host, port: 0 },
      plugins: [
        liveTerm({ enabled, dirs: {}, shell: ["zsh", "-f"], promptMarker: "\u001b]133;A\u0007" }),
      ],
    });
    let socket: WebSocket | undefined;
    try {
      await server.listen();
      const address = server.httpServer?.address();
      if (!address || typeof address === "string") throw new Error("Missing Vite port");
      socket = new WebSocket(`ws://127.0.0.1:${address.port}`, "vite-hmr");
      const events: string[] = [];
      socket.addEventListener("message", ({ data }) => {
        const message = JSON.parse(String(data));
        if (message.type === "custom") events.push(message.event);
      });
      server.ws.on("term-test:barrier", (_data, client) => client.send("term-test:barrier"));
      await vi.waitFor(() => expect(socket?.readyState).toBe(WebSocket.OPEN), { timeout: 10_000 });
      socket.send(
        JSON.stringify({
          type: "custom",
          event: TERM_ATTACH,
          data: {
            pane: { id: "disabled", rows: 24, cols: 92, cwd: "unconfigured", commands: [] },
          },
        }),
      );
      socket.send(JSON.stringify({ type: "custom", event: "term-test:barrier", data: {} }));
      await vi.waitFor(() => expect(events).toContain("term-test:barrier"), { timeout: 10_000 });
      expect(events).toEqual(["term-test:barrier"]);
      expect(warnings).toEqual(
        enabled ? ['Live terminal disabled: host "0.0.0.0" is not loopback'] : [],
      );
    } finally {
      socket?.close();
      await server.close();
    }
  },
);

test.skipIf(process.platform !== "darwin" || process.env.DECKS_LIVE_TERM !== "1")(
  "a real HMR socket runs a prepared command in a real shell and returns to its prompt",
  async () => {
    const server = await createServer({
      configFile: false,
      root: import.meta.dirname,
      server: { host: "127.0.0.1", port: 0 },
      logLevel: "silent",
      plugins: [
        liveTerm({
          enabled: true,
          dirs: {},
          shell: ["zsh", "-f"],
          promptMarker: "\u001b]133;A\u0007",
        }),
      ],
    });
    let socket: WebSocket | undefined;
    try {
      await server.listen();
      const url = server.resolvedUrls?.local[0];
      if (!url) throw new Error("Vite did not bind a loopback URL");
      socket = new WebSocket(url.replace("http:", "ws:"), "vite-hmr");
      const events: { event: string; data: { chunk?: string; busy?: boolean; ran?: number[] } }[] =
        [];
      socket.addEventListener("message", ({ data }) => {
        const message = JSON.parse(String(data));
        if (message.type === "custom") events.push(message);
      });
      await vi.waitFor(() => expect(socket?.readyState).toBe(WebSocket.OPEN), { timeout: 10_000 });
      socket.send(
        JSON.stringify({
          type: "custom",
          event: TERM_ATTACH,
          data: {
            pane: {
              id: "real",
              rows: 24,
              cols: 92,
              cwd: "temp",
              commands: ["echo deck-$((6*7))"],
            },
          },
        }),
      );
      await vi.waitFor(() => expect(events.some((e) => e.event === TERM_READY)).toBe(true), {
        timeout: 10_000,
      });
      socket.send(
        JSON.stringify({ type: "custom", event: TERM_STEP, data: { id: "real", click: 1 } }),
      );
      await vi.waitFor(
        () => {
          const output = events
            .filter((e) => e.event === TERM_DATA)
            .map((e) => e.data.chunk)
            .join("");
          expect(output).toContain("\r\ndeck-42\r\n");
          expect(output.split("\u001b]133;A\u0007").length).toBeGreaterThanOrEqual(3);
          expect(events.filter((e) => e.event === TERM_STATE).at(-1)?.data).toEqual({
            id: "real",
            busy: false,
            ran: [1],
          });
        },
        { timeout: 10_000 },
      );
    } finally {
      socket?.close();
      await server.close();
    }
  },
);
