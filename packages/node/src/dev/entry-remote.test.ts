import { createHash } from "node:crypto";
import { REMOTE_INTENT, REMOTE_POSITION } from "@react-decks/core";
import { expect, it, onTestFinished } from "vitest";
import { loadDeck } from "./config";
import { entryModule } from "./entry";
import { fixture } from "./server.test-support";

it("the generated entry wires the link only when remote is on, and is unchanged otherwise", async () => {
  const deck = await loadDeck((await fixture(onTestFinished)).dir);
  // Digest of the emitted entry on feat/remote-and-motion for a deck without optional files.
  expect(createHash("sha256").update(entryModule(deck)).digest("hex")).toBe(
    "4a23c304a2cbed53d174d84c8e3075488a896ef8b30081eeb0262eaa8a860473",
  );
  const entry = entryModule(deck, true);
  expect(entry).toMatch(/mountDeck\(\{[\s\S]*?\},\s*undefined,\s*\{\s*remote:\s*import\.meta\.hot/);
  expect(entry).toContain(`send("${REMOTE_POSITION}",`);
  expect(entry).toContain(`on("${REMOTE_INTENT}",`);
  expect(entry).toContain(`off("${REMOTE_INTENT}",`);
});
