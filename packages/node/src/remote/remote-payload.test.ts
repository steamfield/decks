import { expect, test } from "vitest";
import { waitForWatcher } from "../dev/server.test-support";
import { connectRemote, connectWindow, firstDeck, remoteFixture } from "./remote.test-support";

test("pushes a fresh deck payload when a slide's notes change", async () => {
  const body = "---\nclicks: 1\n---\n# Talk";
  const app = await remoteFixture({ "slides/01-first.mdx": body });
  const remote = await connectRemote(app);
  await remote.at(1, { type: "waiting" });
  await app.put(
    "slides/01-first.mdx",
    `${body}\n\n<Notes>\n\nFirst **note**.\n\n[click] Again.\n\n</Notes>`,
  );
  await remote.at(2, {
    type: "deck",
    deck: {
      title: "Test deck",
      slides: [
        {
          id: "01-first",
          title: "01-first",
          clicks: 1,
          notes: [
            { click: 0, html: "<p>First <strong>note</strong>.</p>" },
            { click: 1, html: "<p>Again.</p>" },
          ],
        },
      ],
    },
  });
});

test("leaves hidden slides out of the payload", async () => {
  const remote = await connectRemote(
    await remoteFixture({ "slides/02-secret.mdx": "---\nhide: true\n---\n# Hidden" }),
  );
  await remote.at(0, { type: "deck", deck: firstDeck });
});

test("malformed notes name their slide and leave healthy slides available for hot updates", async () => {
  const app = await remoteFixture({
    "slides/02-bad.mdx": "---\nclicks: 0\n---\n<Notes>\n\n{unfinished\n\n</Notes>",
  });
  const remote = await connectRemote(app);
  const window = await connectWindow(app.devUrl);
  await app.put("slides/01-first.mdx", "---\ntitle: Still editing\n---\n# Healthy");
  await waitForWatcher(() => expect(window.frames).toContainEqual({ type: "full-reload" }));
  expect(app.errors.join("\n")).toContain("02-bad.mdx");
  await waitForWatcher(() =>
    expect(remote.messages).toContainEqual({
      type: "deck",
      deck: {
        title: "Test deck",
        slides: [
          { id: "01-first", title: "Still editing", clicks: 0, notes: [] },
          { id: "02-bad", title: "02-bad", clicks: 0, notes: [] },
        ],
      },
    }),
  );
});

test("a rejected config restart keeps the remote on the deck that is still serving", async () => {
  const app = await remoteFixture();
  const remote = await connectRemote(app);
  await remote.at(1, { type: "waiting" });
  await app.put(
    "deck.config.ts",
    'export default {title:"Rejected", vite:{plugins:[{name:"unavailable", configureServer(){throw Error("cannot start replacement")}}]}}',
  );
  await waitForWatcher(() => expect(app.errors.join("\n")).toContain("server restart failed"));
  remote.send({ type: "ping" });
  await waitForWatcher(() => expect(remote.messages.at(-1)).toEqual({ type: "pong" }));
  expect(remote.messages).toEqual([
    { type: "deck", deck: firstDeck },
    { type: "waiting" },
    { type: "pong" },
  ]);
  const later = await connectRemote(app);
  await later.at(0, { type: "deck", deck: firstDeck });
});
