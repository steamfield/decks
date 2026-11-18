import { once } from "node:events";
import { expect, test } from "vitest";
import { connectRemote, remoteFixture } from "./remote.test-support";

test.each([
  ["an unknown message type", '{"type":"wat"}', 1008],
  ["unparsable JSON", "???", 1008],
  ["a go to slide 0", '{"type":"go","slide":0}', 1008],
  ["an oversized frame", '{"type":"ping"}'.padEnd(4097), 1009],
])("closes the socket on %s with its close code and logs the sender", async (_name, data, code) => {
  const app = await remoteFixture();
  const remote = await connectRemote(app);
  const closed = once(remote.socket, "close");
  remote.socket.send(data);
  expect((await closed)[0]).toBe(code);
  // The socket dials the printed address, a local one, so the sender is that address.
  expect(app.warnings).toEqual([`Remote presenter: invalid message from ${app.url.hostname}`]);
});
