import type { RemoteIntent, RemoteServerMessage } from "@react-decks/core";
import { expect, onTestFinished, test, vi } from "vitest";
import { waitForWatcher } from "../dev/server.test-support";
import { createRelay } from "./relay";
import {
  connectRemote,
  connectWindow,
  firstDeck,
  play,
  remoteFixture,
} from "./remote.test-support";

function setup() {
  const relay = createRelay(firstDeck);
  const messages: RemoteServerMessage[] = [];
  const send = (message: RemoteServerMessage) => messages.push(message);
  relay.connect(send);
  const intents: RemoteIntent[] = [];
  const window = (intent: RemoteIntent) => intents.push(intent);
  return { relay, messages, send, intents, window };
}
const initial = { type: "position", slide: 1, click: 0, elapsed: null };

test("sends deck then waiting to a remote that connects before any window", async () => {
  const remote = await connectRemote(await remoteFixture());
  await remote.at(1, { type: "waiting" });
  expect(remote.messages).toEqual([{ type: "deck", deck: firstDeck }, { type: "waiting" }]);
});

test("sends deck then the current position to a remote that connects after a window reported", async () => {
  const app = await remoteFixture();
  const window = await connectWindow(app.devUrl);
  await window.report(play);
  const remote = await connectRemote(app);
  await remote.at(1, initial);
  expect(remote.messages).toEqual([{ type: "deck", deck: firstDeck }, initial]);
});

test("pushes position with elapsed time to every remote when a window's slide or click changes", () => {
  vi.useFakeTimers({ toFake: ["Date", "performance"] });
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const { relay, messages, window } = setup();
  const other: RemoteServerMessage[] = [];
  relay.connect((message) => other.push(message));
  relay.report(window, play);
  relay.report(window, { ...play, click: 1 });
  vi.advanceTimersByTime(1500);
  vi.setSystemTime(Date.now() - 5000);
  relay.report(window, { ...play, slide: 2 });
  relay.report(window, { ...play, slide: 3 });
  expect(messages.slice(2)).toEqual([
    initial,
    { ...initial, click: 1, elapsed: 0 },
    { ...initial, slide: 2, elapsed: 1500 },
    { ...initial, slide: 3, elapsed: 1500 },
  ]);
  expect(other).toEqual(messages);
});

test("does not push when a window reports the same slide and click again", () => {
  const { relay, messages, window, send } = setup();
  relay.report(window, play);
  relay.report(window, { ...play, focused: false });
  relay.receive(send, { type: "ping" });
  expect(messages.slice(2)).toEqual([initial, { type: "pong" }]);
});

test("forwards an intent to exactly one of two windows: the most recently focused play window", async () => {
  const app = await remoteFixture();
  const a = await connectWindow(app.devUrl);
  const b = await connectWindow(app.devUrl);
  const remote = await connectRemote(app);
  await a.report(play);
  await b.report(play);
  await a.report({ ...play, focused: false });
  await a.report(play);
  await b.report({ ...play, click: 1 });
  await b.report({ ...play, click: 1, focused: false });
  remote.send({ type: "go", slide: 3 });
  await waitForWatcher(() => expect(a.intents).toEqual([{ type: "go", slide: 3 }]));
  await b.barrier();
  expect(b.intents).toEqual([]);
});

test("still targets the play window after it reports unfocused", () => {
  const { relay, window, intents, send } = setup();
  const other: RemoteIntent[] = [];
  relay.report(window, play);
  relay.report(window, { ...play, focused: false });
  relay.report((intent) => other.push(intent), { ...play, view: "presenter" });
  relay.receive(send, { type: "next" });
  expect([intents, other]).toEqual([[{ type: "next" }], []]);
});

test("targets the presenter window when no play window is connected", () => {
  const { relay, window, intents, send } = setup();
  const other: RemoteIntent[] = [];
  const presenter = (intent: RemoteIntent) => other.push(intent);
  relay.report(window, { ...play, view: "presenter" });
  relay.report(presenter, { ...play, view: "presenter" });
  relay.report(window, { ...play, view: "presenter", focused: false });
  relay.receive(send, { type: "prev" });
  expect([intents, other]).toEqual([[{ type: "prev" }], []]);
});

test("never targets a window that is only in the overview", () => {
  const { relay, window, messages, send, intents } = setup();
  relay.report(window, { ...play, view: "overview" });
  relay.receive(send, { type: "next" });
  expect(messages.slice(2)).toEqual([initial, { type: "waiting" }]);
  expect(intents).toEqual([]);
});

test("replies waiting to an intent when no window is connected", () => {
  const { relay, messages, send } = setup();
  const other: RemoteServerMessage[] = [];
  relay.connect((message) => other.push(message));
  relay.receive(send, { type: "next" });
  expect(messages.slice(2)).toEqual([{ type: "waiting" }]);
  expect(other.slice(2)).toEqual([]);
});

test("pushes waiting when the last window disconnects", () => {
  const { relay, messages, window } = setup();
  const second = () => {};
  relay.report(window, play);
  relay.report(second, play);
  relay.disconnect(window);
  expect(messages.slice(2)).toEqual([initial]);
  relay.disconnect(second);
  expect(messages.slice(2)).toEqual([initial, { type: "waiting" }]);
});

test("reset-timer pushes the position with elapsed null and restarts the count at the next change", () => {
  vi.useFakeTimers({ toFake: ["Date", "performance"] });
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const { relay, messages, send, window } = setup();
  const other: RemoteServerMessage[] = [];
  relay.connect((message) => other.push(message));
  relay.report(window, play);
  relay.report(window, { ...play, click: 1 });
  vi.advanceTimersByTime(2000);
  relay.receive(send, { type: "reset-timer" });
  vi.advanceTimersByTime(5000);
  relay.report(window, { ...play, click: 2 });
  expect(messages.slice(-2)).toEqual([
    { ...initial, click: 1 },
    { ...initial, click: 2, elapsed: 0 },
  ]);
  expect(other).toEqual(messages);
});

test("only a remote that was waiting needs the same position again when a play window gains focus", () => {
  const { relay, messages, send, window } = setup();
  relay.report(window, { ...play, view: "overview" });
  const other: RemoteServerMessage[] = [];
  relay.connect((message) => other.push(message));
  relay.receive(send, { type: "next" });
  relay.report(window, play);
  expect(messages.slice(2)).toEqual([initial, { type: "waiting" }, initial]);
  expect(other).toEqual([{ type: "deck", deck: firstDeck }, initial]);
});

test("a play window that reconnects behind the editor can advance until a presenter joins", () => {
  const { relay, window, intents, send } = setup();
  const other: RemoteIntent[] = [];
  relay.report(window, { ...play, focused: false });
  relay.receive(send, { type: "next" });
  relay.report((intent) => other.push(intent), { ...play, view: "presenter" });
  relay.receive(send, { type: "prev" });
  expect([intents, other]).toEqual([[{ type: "next" }], [{ type: "prev" }]]);
});
