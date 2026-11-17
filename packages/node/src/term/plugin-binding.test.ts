import { createServer as createHttpServer } from "node:http";
import { TERM_ATTACH } from "@react-decks/core";
import getPort from "get-port";
import { createLogger, createServer } from "vite";
import { expect, onTestFinished, test, vi } from "vitest";
import { fixture } from "../dev/server.test-support";
import { liveTerm } from "./plugin";

test.each(["port", "server"] as const)(
  "a separate WebSocket %s cannot enable shell handlers",
  async (kind) => {
    const { dir } = await fixture(onTestFinished);
    const external = createHttpServer();
    let port = await getPort();
    if (kind === "server") {
      await new Promise<void>((resolve) => external.listen(0, "127.0.0.1", resolve));
      onTestFinished(
        () =>
          new Promise<void>((resolve, reject) =>
            external.close((error) => (error ? reject(error) : resolve())),
          ),
      );
      const address = external.address();
      if (!address || typeof address === "string") throw new Error("Missing external HMR port");
      port = address.port;
    }
    const warnings: string[] = [];
    const logger = createLogger("silent");
    logger.warn = (message) => {
      warnings.push(message);
    };
    const server = await createServer({
      configFile: false,
      root: dir,
      customLogger: logger,
      server: {
        host: "127.0.0.1",
        port: 0,
        ws: kind === "port" ? { port, host: "0.0.0.0" } : { server: external },
      },
      plugins: [liveTerm(dir)],
    });
    onTestFinished(() => server.close());
    await server.listen();
    const socket = new WebSocket(`ws://127.0.0.1:${port}`, "vite-hmr");
    onTestFinished(() => socket.close());
    const events: string[] = [];
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(String(data));
      if (message.type === "custom") events.push(message.event);
    });
    await vi.waitFor(() => expect(socket.readyState).toBe(WebSocket.OPEN), { timeout: 10_000 });
    server.ws.on("term-test:barrier", (_data, client) => client.send("term-test:barrier"));
    socket.send(
      JSON.stringify({
        type: "custom",
        event: TERM_ATTACH,
        data: { pane: { id: "separate", rows: 24, cols: 92, cwd: "unknown", commands: [] } },
      }),
    );
    socket.send(JSON.stringify({ type: "custom", event: "term-test:barrier", data: {} }));
    await vi.waitFor(() => expect(events).toContain("term-test:barrier"), { timeout: 10_000 });
    expect(events).toEqual(["term-test:barrier"]);
    expect(warnings).toEqual([
      "Live terminal disabled: a separate HMR WebSocket transport is not supported",
    ]);
  },
);
