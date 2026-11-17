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
import { z } from "zod";
import { loadDeck } from "../dev/config";
import { DeckError, displayPath } from "../dev/errors";
import { shellEnvironment } from "./environment";
import { createSessions } from "./sessions";
import { shellSpawn } from "./shell";

const attachMessage = z.object({
  pane: z.object({
    id: z.string(),
    cwd: z.string(),
    rows: z.int().min(1).max(65535),
    cols: z.int().min(1).max(65535),
    commands: z.array(z.string()),
  }),
});
const positionMessage = z.object({
  id: z.string(),
  click: z.int().min(0),
  entered: z.boolean(),
  stamp: z.object({ seq: z.int().min(0), started: z.number(), origin: z.string() }),
});
const inputMessage = z.object({ id: z.string(), data: z.string() });

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
        if (server.config.legacy?.skipWebSocketTokenCheck === true) {
          server.config.logger.warn(
            "Live terminal disabled: legacy.skipWebSocketTokenCheck disables WebSocket authentication",
          );
          return;
        }
        if (server.config.server.allowedHosts === true) {
          server.config.logger.warn("Live terminal disabled: server.allowedHosts allows any Host");
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
        const malformed = (event: string, error: z.ZodError) =>
          server.config.logger.warn(
            `Live terminal: malformed ${event}: ${error.issues.map((issue) => `${issue.path.join(".") || "message"}: ${issue.message}`).join("; ")}`,
          );
        const sockets = new WeakSet<object>();
        server.ws.on(TERM_ATTACH, (message: unknown, client) => {
          const parsed = attachMessage.safeParse(message);
          if (!parsed.success) return malformed(TERM_ATTACH, parsed.error);
          const { pane }: TermAttach = parsed.data;
          // Closing a socket removes its subscriptions, but never ends its session.
          if (!sockets.has(client.socket)) {
            sockets.add(client.socket);
            client.socket.once("close", () => sessions.detach(client));
          }
          sessions.attach(pane, client);
        });
        server.ws.on(TERM_POSITION, (message: unknown, client) => {
          const parsed = positionMessage.safeParse(message);
          if (!parsed.success) return malformed(TERM_POSITION, parsed.error);
          const { id, click, entered, stamp }: TermPosition = parsed.data;
          sessions.position(id, click, entered, client, stamp);
        });
        server.ws.on(TERM_INPUT, (message: unknown, client) => {
          const parsed = inputMessage.safeParse(message);
          if (!parsed.success) return malformed(TERM_INPUT, parsed.error);
          const { id, data }: TermInput = parsed.data;
          sessions.input(id, data, client);
        });
        server.httpServer?.once("close", () => sessions.close());
      };
      server.httpServer?.once("listening", bind);
    },
  };
}
