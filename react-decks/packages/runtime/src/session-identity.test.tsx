import { createMemoryHub, type SyncMessage } from "@react-decks/core";
import { render, screen } from "@testing-library/react";

import { expect, it, onTestFinished } from "vitest";
import { install, makeSource } from "./deck.test-support";
import { createDeckStore, Deck } from "./index";

it("without randomUUID a synced deck uses sixteen random bytes and still renders", async () => {
  install(crypto, "randomUUID", undefined);
  const byteCounts: number[] = [];
  install(crypto, "getRandomValues", (bytes: Uint8Array) => {
    byteCounts.push(bytes.length);
    bytes.set(Array.from({ length: 16 }, (_, index) => index));
    return bytes;
  });
  window.history.replaceState(null, "", "/#/2");
  const source = makeSource();
  const hub = createMemoryHub();
  const observer = hub.connect();
  const received: SyncMessage[] = [];
  observer.subscribe((message) => received.push(message));
  onTestFinished(() => {
    observer.close();
    window.history.replaceState(null, "", "/");
  });
  const store = createDeckStore(source.manifest, { transport: hub.connect() });
  const rendered = render(<Deck source={source} store={store} />);
  onTestFinished(() => {
    rendered.unmount();
    store.destroy();
  });
  expect(await screen.findByRole("heading", { name: "Title 2" })).toBeVisible();
  expect(byteCounts).toEqual([16]);
  expect(received.map((message) => message.from)).toEqual(["000102030405060708090a0b0c0d0e0f"]);
});
