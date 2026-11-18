import { once } from "node:events";
import { expect, test } from "vitest";
import { connectRemote, remoteFixture } from "./remote.test-support";

test("closes with 1009 on an oversized frame and 1008 on unknown or unparsable messages", async () => {
  const app = await remoteFixture();
  for (const data of [
    '{"type":"wat"}',
    "???",
    '{"type":"go","slide":0}',
    '{"type":"ping"}'.padEnd(4097),
  ]) {
    const remote = await connectRemote(app);
    const closed = once(remote.socket, "close");
    remote.socket.send(data);
    expect((await closed)[0]).toBe(data.length > 4096 ? 1009 : 1008);
  }
  expect(app.warnings).toHaveLength(4);
});
