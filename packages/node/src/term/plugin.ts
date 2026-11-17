import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TERM_ATTACH,
  TERM_INPUT,
  TERM_POSITION,
  type TermAttach,
  type TermInput,
  type TermPosition,
} from "@react-decks/core";
import type { Plugin } from "vite";
import { loadDeck } from "../dev/config";
import { DeckError, displayPath } from "../dev/errors";
import { shellEnvironment } from "./environment";
import { createSessions } from "./sessions";
import { shellSpawn } from "./shell";

export function liveTerm(deckDir: string, platform = process.platform): Plugin {
  return {
    name: "deck-live-term",
    apply: "serve",
    async configureServer(server) {
      const dirs = (await loadDeck(deckDir)).config.term?.dirs ?? {};
      for (const [key, path] of Object.entries(dirs)) {
        let isDirectory: boolean;
        try {
          isDirectory = statSync(path, { throwIfNoEntry: false })?.isDirectory() ?? false;
        } catch (cause) {
          throw new DeckError(
            `cannot inspect term.dirs key "${key}" at "${displayPath(path)}". Check that the directory is accessible.`,
            join(deckDir, "deck.config.ts"),
            undefined,
            { cause },
          );
        }
        if (!isDirectory)
          throw new DeckError(
            `term.dirs key "${key}" points at "${displayPath(path)}", which is not a directory.`,
            join(deckDir, "deck.config.ts"),
          );
      }
      const bind = () => {
        if (platform === "win32") {
          server.config.logger.warn("Live terminal disabled: Windows is not supported");
          return;
        }
        const ws = server.config.server.ws;
        if (
          ws &&
          ((ws.server && ws.server !== server.httpServer) ||
            (ws.port && ws.port !== server.config.server.port))
        ) {
          server.config.logger.warn(
            "Live terminal disabled: a separate HMR WebSocket transport is not supported",
          );
          return;
        }
        const address = server.httpServer?.address();
        const host = address && typeof address !== "string" ? address.address : String(address);
        if (!(host === "::1" || /^127\./.test(host) || /^::ffff:127\./.test(host))) {
          server.config.logger.warn(`Live terminal disabled: host "${host}" is not loopback`);
          return;
        }
        const sessions = createSessions({
          spawn: shellSpawn(),
          clock: {
            later(run, ms) {
              const timer = setTimeout(run, ms);
              return () => clearTimeout(timer);
            },
          },
          tempDir: () => mkdtempSync(join(tmpdir(), "deck-term-")),
          dirs,
          env: {
            ...shellEnvironment(process.env),
            TERM: "xterm-256color",
            ZDOTDIR: fileURLToPath(
              new URL(
                `${import.meta.url.endsWith(".ts") ? "../../term/" : "./term/"}zsh`,
                import.meta.url,
              ),
            ),
          },
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
        server.ws.on(TERM_POSITION, ({ id, click, entered }: TermPosition, client) =>
          sessions.position(id, click, entered, client),
        );
        server.ws.on(TERM_INPUT, ({ id, data }: TermInput, client) =>
          sessions.input(id, data, client),
        );
        server.httpServer?.once("close", () => sessions.close());
      };
      server.httpServer?.once("listening", bind);
    },
  };
}
