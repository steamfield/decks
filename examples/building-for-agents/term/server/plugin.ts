import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import {
  TERM_ATTACH,
  TERM_INPUT,
  TERM_RESET,
  TERM_STEP,
  type TermAttach,
  type TermInput,
  type TermReset,
  type TermStep,
} from "../protocol";
import { shellEnvironment } from "./environment";
import { createSessions } from "./sessions";
import { shellSpawn } from "./shell";

export function liveTerm(options: {
  enabled: boolean;
  dirs: Record<string, string>;
  shell: readonly string[];
  promptMarker: string;
}): Plugin {
  return {
    name: "deck-live-term",
    apply: "serve",
    configureServer(server) {
      if (!options.enabled) return;
      const bind = () => {
        const address = server.httpServer?.address();
        const host = address && typeof address !== "string" ? address.address : String(address);
        if (!(host === "::1" || /^127\./.test(host) || /^::ffff:127\./.test(host))) {
          server.config.logger.warn(`Live terminal disabled: host "${host}" is not loopback`);
          return;
        }
        const sessions = createSessions({
          spawn: shellSpawn(options.shell),
          clock: {
            later(run, ms) {
              const timer = setTimeout(run, ms);
              return () => clearTimeout(timer);
            },
          },
          tempDir: () => mkdtempSync(join(tmpdir(), "deck-term-")),
          dirs: options.dirs,
          env: {
            ...shellEnvironment(process.env),
            TERM: "xterm-256color",
            DO_NOT_TRACK: "1",
            ZDOTDIR: fileURLToPath(new URL("./zsh", import.meta.url)),
            DECK_TERM_PROMPT_MARKER: options.promptMarker,
          },
          promptMarker: options.promptMarker,
          log: (reason) => server.config.logger.warn(`Live terminal: ${reason}`),
        });
        const sockets = new WeakSet<object>();
        server.ws.on(TERM_ATTACH, ({ pane }: TermAttach, client) => {
          // Closing a socket removes its subscriptions, but never ends its session.
          if (!sockets.has(client.socket)) {
            sockets.add(client.socket);
            client.socket.once("close", () => sessions.detach(client));
          }
          sessions.attach(pane, client);
        });
        server.ws.on(TERM_STEP, ({ id, click }: TermStep, client) =>
          sessions.step(id, click, client),
        );
        server.ws.on(TERM_INPUT, ({ id, data }: TermInput, client) =>
          sessions.input(id, data, client),
        );
        server.ws.on(TERM_RESET, ({ id }: TermReset, client) => sessions.reset(id, client));
        server.httpServer?.once("close", () => sessions.close());
      };
      server.httpServer?.once("listening", bind);
    },
  };
}
