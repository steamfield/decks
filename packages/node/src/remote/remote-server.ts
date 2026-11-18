import { randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { hostname, networkInterfaces } from "node:os";
import type { RemoteServerMessage } from "@react-decks/core";
import getPort from "get-port";
import { renderUnicodeCompact } from "uqr";
import { type Logger, preview } from "vite";
import { WebSocket, WebSocketServer } from "ws";
import { DeckError } from "../dev/errors";
import type { createRelay } from "./relay";
import { clientMessage, maxPayload } from "./remote-messages";
import type { buildRemotePage } from "./remote-page";

/**
 * The `.local` name Bonjour answers for a machine called `hostname`, lowercased. Bonjour answers
 * for the first label only, so a DHCP domain (`mbp.lan`) or an existing `.local` is dropped.
 */
export function mdnsName(hostname: string): string {
  return `${hostname.toLowerCase().split(".")[0]}.local`;
}

export async function startRemoteServer(
  devUrl: string,
  requestedPort: number | undefined,
  relay: ReturnType<typeof createRelay>,
  buildPage: (token: string) => ReturnType<typeof buildRemotePage>,
  logger: Logger,
) {
  const devPort = Number(new URL(devUrl).port || 80);
  if (requestedPort === undefined && devPort === 65535)
    throw new DeckError("No remote port above 65535. Pass --remote-port <n>.");
  const port =
    requestedPort === undefined
      ? await getPort({ port: Array.from({ length: 65535 - devPort }, (_, i) => devPort + i + 1) })
      : requestedPort;
  if (requestedPort === undefined && port <= devPort)
    throw new DeckError(`No remote port available above ${devPort}. Pass --remote-port <n>.`);
  const token = randomBytes(16).toString("hex");
  const addresses = new Set(
    Object.values(networkInterfaces()).flatMap((nic) =>
      (nic ?? [])
        .filter((addr) => addr.family === "IPv4" && !addr.internal)
        .map((addr) => addr.address),
    ),
  );
  const hosts = [...(addresses.size ? addresses : ["127.0.0.1"]), mdnsName(hostname())];
  let origins: string[] = [];
  const expected = Buffer.from(token);
  // Constant time, so response timing does not reveal how much of a guessed token matched.
  const tokenMatches = (given: string | null | undefined) => {
    const actual = Buffer.from(given ?? "");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  };
  const authorized = (req: IncomingMessage) =>
    origins.includes(`http://${req.headers.host?.toLowerCase()}`) &&
    tokenMatches(URL.parse(req.url ?? "/", origins[0])?.searchParams.get("token"));
  const refused = (req: IncomingMessage) =>
    logger.warn(`Remote presenter: refused request from ${req.socket.remoteAddress}`);
  const page = await buildPage(token);
  const sockets = new WebSocketServer({ noServer: true, path: "/ws", maxPayload });
  sockets.on("connection", (socket, req) => {
    const send = (message: RemoteServerMessage) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    };
    socket.once("close", relay.connect(send));
    const invalid = () =>
      logger.warn(`Remote presenter: invalid message from ${req.socket.remoteAddress}`);
    socket.on("error", invalid);
    socket.on("message", (data, binary) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      if (!binary) {
        try {
          const parsed = clientMessage.safeParse(JSON.parse(data.toString()));
          if (parsed.success) {
            relay.receive(send, parsed.data);
            return;
          }
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
        }
      }
      invalid();
      socket.close(1008);
    });
  });
  try {
    const running = await preview({
      configFile: false,
      root: page.dir,
      envDir: false,
      appType: "mpa",
      publicDir: false,
      build: { outDir: page.dir },
      logLevel: "silent",
      preview: {
        host: "0.0.0.0",
        port,
        strictPort: requestedPort !== undefined,
        allowedHosts: [...hosts],
        cors: false,
      },
      plugins: [
        {
          name: "deck-remote-access",
          configurePreviewServer(server) {
            server.httpServer.once("listening", () => {
              const address = server.httpServer.address();
              if (!address || typeof address === "string")
                throw Error("Missing remote presenter TCP address");
              origins = hosts.map((host) => new URL(`http://${host}:${address.port}`).origin);
            });
            server.middlewares.use((req, res, next) => {
              res.setHeader("Cache-Control", "no-store");
              res.setHeader("Referrer-Policy", "no-referrer");
              if (authorized(req)) return next();
              refused(req);
              res.writeHead(403, { "Content-Type": "text/plain" }).end("Forbidden");
            });
            server.httpServer.on("upgrade", (req, socket, head) => {
              if (
                !authorized(req) ||
                req.headers.origin !== `http://${req.headers.host?.toLowerCase()}`
              ) {
                refused(req);
                socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
                return;
              }
              sockets.handleUpgrade(req, socket, head, (ws) => sockets.emit("connection", ws, req));
            });
          },
          closePreviewServer: page.cleanup,
        },
      ],
    });
    logger.info(devUrl);
    logger.info("Remote presenter:");
    if (!addresses.size) logger.info("No LAN IPv4 address found. Serving on loopback.");
    const urls = origins.map((origin) => `${origin}/?token=${token}`);
    for (const url of urls) logger.info(url);
    logger.info(renderUnicodeCompact(urls[0] ?? devUrl));
    return async () => {
      for (const client of sockets.clients) client.terminate();
      sockets.close();
      await running.close();
    };
  } catch (error) {
    sockets.close();
    await page.cleanup();
    if (error instanceof Error && error.message === `Port ${port} is already in use`)
      throw new DeckError(
        `remote port ${port} is already in use. Pass a different --remote-port.`,
        undefined,
        undefined,
        { cause: error },
      );
    throw error;
  }
}
