import { REMOTE_INTENT, REMOTE_POSITION } from "@react-decks/core";
import { expect, it, onTestFinished } from "vitest";
import { loadDeck } from "./config";
import { entryModule } from "./entry";
import { fixture } from "./server.test-support";

it("the generated entry wires the remote link only when remote is on", async () => {
  const deck = await loadDeck((await fixture(onTestFinished)).dir);
  expect(entryModule(deck)).not.toContain("deck-remote:");
  expect(entryModule(deck)).not.toContain("remote:");
  const entry = entryModule(deck, true);
  expect(entry).toMatch(/mountDeck\(\{[\s\S]*?\},\s*undefined,\s*\{\s*remote:\s*import\.meta\.hot/);
  expect(entry).toContain(`send("${REMOTE_POSITION}",`);
  expect(entry).toContain(`on("${REMOTE_INTENT}",`);
  expect(entry).toContain(`off("${REMOTE_INTENT}",`);
});
