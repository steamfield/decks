import { expect } from "@playwright/test";
import { boot, step, test } from "./fixtures/embed.fixture";

const commands = [
  [
    "next advances a beat",
    "2",
    "next",
    {},
    { slide: 2, beat: 1, lead: "Lead 1", body: "Body 1", direction: "forward" },
  ],
  ["prev reverses a beat", "2?clicks=1", "prev", {}, { slide: 2, beat: 0, direction: "backward" }],
  [
    "go selects a beat",
    "2",
    "go",
    { slide: 2, beat: 2 },
    { slide: 2, beat: 2, lead: "Lead 2", direction: "forward" },
  ],
  [
    "next crosses a slide boundary",
    "2?clicks=2",
    "next",
    {},
    { slide: 3, beat: 0, beats: 1, lead: "", body: "", direction: "forward" },
  ],
  [
    "prev crosses to the last beat",
    "3",
    "prev",
    {},
    { slide: 2, beat: 2, lead: "Lead 2", direction: "backward" },
  ],
  [
    "nextSlide skips remaining beats",
    "2?clicks=1",
    "nextSlide",
    {},
    { slide: 3, beat: 0, direction: "forward" },
  ],
  ["go selects a stage beat", "3", "go", { slide: 3, beat: 1 }, { slide: 3, beat: 1 }],
  [
    "prevSlide returns to beat zero",
    "3?clicks=1",
    "prevSlide",
    {},
    { slide: 2, beat: 0, direction: "backward" },
  ],
  [
    "go clamps below the first slide and beat",
    "2",
    "go",
    { slide: -10, beat: -5 },
    { slide: 1, beat: 0, lead: "", body: "" },
  ],
  ["prev acknowledges the start boundary", "1", "prev", {}, { slide: 1, beat: 0, direction: null }],
  [
    "go acknowledges an unchanged position",
    "1",
    "go",
    { slide: 1, beat: 0 },
    { slide: 1, beat: 0, direction: null },
  ],
  ["go clamps above the last slide", "1", "go", { slide: 200, beat: 0 }, { slide: 4, beat: 0 }],
  [
    "nextSlide acknowledges the end boundary",
    "4",
    "nextSlide",
    {},
    { slide: 4, beat: 0, direction: null },
  ],
  [
    "go clamps above the last beat",
    "4",
    "go",
    { slide: 2, beat: 200 },
    { slide: 2, beat: 2, beats: 2 },
  ],
] as const;

for (const [name, hash, cmd, extra, wanted] of commands) {
  test(`The host receives an unsettled and settled state when ${name}`, async ({
    page,
    embedURL,
  }) => {
    await boot(page, embedURL, `${embedURL}index.html?decks-bridge=1#/${hash}`);
    const states = await step(page, cmd, 1, extra);
    expect(states.map((message) => message.settled)).toEqual([false, true]);
    expect(states[1]).toMatchObject(wanted);
  });
}
