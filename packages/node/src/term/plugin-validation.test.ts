import { TERM_ATTACH, TERM_GONE, TERM_INPUT, TERM_POSITION } from "@react-decks/core";
import { createLogger, createServer } from "vite";
import { expect, onTestFinished, test, vi } from "vitest";
import { fixture } from "../dev/server.test-support";
import { liveTerm } from "./plugin";
import { connect } from "./plugin.test-support";

test("malformed terminal messages are logged and dropped before a valid barrier reply", async () => {
  const { dir } = await fixture(onTestFinished);
  const warnings: string[] = [];
  const logger = createLogger("silent");
  logger.warn = (message) => {
    warnings.push(message);
  };
  const server = await createServer({
    configFile: false,
    root: dir,
    customLogger: logger,
    server: { host: "127.0.0.1", port: 0 },
    plugins: [liveTerm(dir)],
  });
  onTestFinished(() => server.close());
  await server.listen();
  const { events, send } = await connect(server);
  const pane = { id: "invalid", rows: 24, cols: 92, cwd: "unknown", commands: [] };
  const position = {
    id: pane.id,
    click: 1,
    entered: false,
    stamp: { seq: 1, started: 0, origin: "a" },
  };
  const malformed = [
    ...[
      null,
      {},
      { pane: {} },
      { pane: { ...pane, id: 1 } },
      { pane: { ...pane, cwd: null } },
      { pane: { ...pane, commands: [1] } },
      ...[0, 65536, 1.5, "24"].map((rows) => ({ pane: { ...pane, rows } })),
      ...[0, 65536, 1.5, null].map((cols) => ({ pane: { ...pane, cols } })),
    ].map((data) => ({ event: TERM_ATTACH, data })),
    ...[
      null,
      {},
      { ...position, id: 1 },
      { ...position, entered: "false" },
      ...[-1, 1.5, "1"].map((click) => ({ ...position, click })),
      { ...position, stamp: null },
      { ...position, stamp: { seq: "1", started: 0, origin: "a" } },
      { ...position, stamp: { seq: 1, started: null, origin: "a" } },
      { ...position, stamp: { seq: 1, started: 0, origin: 1 } },
    ].map((data) => ({ event: TERM_POSITION, data })),
    ...[null, {}, { id: 1, data: "ls" }, { id: pane.id, data: 1 }].map((data) => ({
      event: TERM_INPUT,
      data,
    })),
  ];
  for (const message of malformed) send(message.event, message.data);
  // A valid attach to an unknown cwd is a barrier without starting a shell.
  send(TERM_ATTACH, { pane });
  await vi.waitFor(
    () =>
      expect(events).toEqual([
        {
          event: TERM_GONE,
          data: {
            id: pane.id,
            reason:
              'Shell could not start: Pane "invalid" has unknown terminal directory "unknown"',
          },
        },
      ]),
    { timeout: 10_000 },
  );
  expect(warnings).toHaveLength(malformed.length + 1);
  for (const [index, message] of malformed.entries()) {
    expect(warnings[index]).toContain(`Live terminal: malformed ${message.event}`);
    expect(warnings[index]).not.toMatch(/[\r\n]/);
  }
});
