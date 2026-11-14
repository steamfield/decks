import { describe, expect, it } from "vitest";

import { syncChannelId } from "./sync";

describe("syncChannelId", () => {
  it.each(["demo/tides", "/demo/tides", "demo/tides/", "/demo/tides/", "//demo/tides//"])(
    "normalizes base %s to start and end with one slash",
    (base) => {
      expect(syncChannelId("tides", base)).toBe("react-decks:tides:/demo/tides/");
    },
  );
  it.each(["", "/", "//"])("normalizes root base %s", (base) => {
    expect(syncChannelId("tides", base)).toBe("react-decks:tides:/");
  });
});
