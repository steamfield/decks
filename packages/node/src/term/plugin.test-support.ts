import type { ViteDevServer } from "vite";
import { expect, onTestFinished, vi } from "vitest";

export async function connect(server: ViteDevServer) {
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("Missing Vite port");
  const socket = new WebSocket(`ws://127.0.0.1:${address.port}`, "vite-hmr");
  const events: {
    event: string;
    data: {
      id?: string;
      buffer?: string;
      chunk?: string;
      reason?: string;
      busy?: boolean;
      ran?: number[];
    };
  }[] = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.type === "custom") events.push({ event: message.event, data: message.data });
  });
  onTestFinished(() => socket.close());
  await vi.waitFor(() => expect(socket.readyState).toBe(WebSocket.OPEN), { timeout: 10_000 });
  const send = (event: string, data: unknown) =>
    socket.send(JSON.stringify({ type: "custom", event, data }));
  return { socket, events, send };
}
