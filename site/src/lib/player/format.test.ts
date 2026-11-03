import { describe, expect, it } from "vitest";
import { announcement, counterText, dwellMs, mirrorCopy, stepsOf } from "./format";
import type { DeckState } from "./protocol";

const state: DeckState = {
  slide: 2,
  slides: 5,
  beat: 2,
  beats: 3,
  lead: "Sun and Moon in line: spring tides.",
  body: "",
  settled: true,
  direction: null,
};

describe("player readouts", () => {
  it("counts slides and beats from one", () => {
    expect(counterText(state)).toBe("2 · 3/4");
    expect(stepsOf({ beat: 0, beats: 0 })).toBe(1);
    expect(stepsOf({ beat: 0, beats: 2 })).toBe(3);
    expect(stepsOf({ beat: 4, beats: 3 })).toBe(5);
  });

  it("announces the position and the lead", () => {
    expect(announcement(state)).toBe(
      "Slide 2 of 5, step 3 of 4. Sun and Moon in line: spring tides.",
    );
    expect(announcement({ ...state, lead: "" }, "Close")).toBe("Slide 2 of 5, step 3 of 4. Close");
    expect(announcement({ ...state, lead: "" })).toBe("Slide 2 of 5, step 3 of 4.");
  });

  it("mirrors the card, else the slide title, else the slide number", () => {
    expect(mirrorCopy({ ...state, body: "Body." }, [])).toEqual({
      lead: state.lead,
      body: "Body.",
    });
    expect(mirrorCopy({ slide: 2, lead: "", body: "" }, ["Cover", "Agenda"])).toEqual({
      lead: "Agenda",
      body: "",
    });
    expect(mirrorCopy({ slide: 3, lead: "", body: "" }, ["Cover", " "])).toEqual({
      lead: "Slide 3",
      body: "",
    });
  });

  it("holds a beat longer for more words, within 3 to 9 seconds", () => {
    expect(dwellMs({ lead: "", body: "" })).toBe(3000);
    expect(dwellMs({ lead: "One two three four five six", body: "" })).toBe(3600);
    expect(dwellMs({ lead: "word ".repeat(80), body: "" })).toBe(9000);
  });
});
