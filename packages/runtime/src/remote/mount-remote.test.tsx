import { expect, it } from "vitest";
import { remotePage } from "./remote.test-support";

it("reads the token from the page URL and sends it on the socket", () => {
  const page = remotePage();
  expect(page.sockets.map((socket) => String(socket.url))).toEqual([
    `ws://${location.host}/ws?token=t%2B1`,
  ]);
  expect(location.pathname + location.search).toBe(page.url);
});
