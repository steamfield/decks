import { isInaccessible, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { expect, expectTypeOf, it } from "vitest";
import { SplitText, useTimeline } from "./index";
import { setupMotion } from "./motion.test-support";

function Subject() {
  const heading = useRef<HTMLHeadingElement>(null);
  const [enabled, setEnabled] = useState(true);
  useTimeline(
    (tl, beat) => {
      beat(0);
      if (!enabled || !heading.current) return;
      const split = SplitText.create(heading.current, { type: "words" });
      tl.from(split.words, { y: 12 });
      beat(1);
      return () => split.revert();
    },
    [enabled],
  );
  return (
    <>
      <h1 ref={heading}>Hold the beat.</h1>
      <button type="button" onClick={() => setEnabled(!enabled)}>
        Toggle split
      </button>
    </>
  );
}
it("a SplitText split inside a timeline build is reverted on rebuild and on unmount, leaving the original text", async () => {
  expectTypeOf<Parameters<typeof useTimeline>[0]>().returns.toEqualTypeOf<void | (() => void)>();
  const app = await setupMotion(Subject, { click: 1 });
  const heading = screen.getByRole("heading", { name: "Hold the beat." });
  expect(heading.childElementCount).toBe(3);
  const toggle = screen.getByRole("button", { name: "Toggle split" });
  await app.user.click(toggle);
  expect(heading.innerHTML).toBe("Hold the beat.");
  await app.user.click(toggle);
  expect(heading.childElementCount).toBe(3);
  app.unmount();
  expect(heading.innerHTML).toBe("Hold the beat.");
});

it("split text is read once by its accessible name", async () => {
  await setupMotion(Subject, { click: 1 });
  const sentence = "Hold the beat.";
  const heading = screen.getByRole("heading", { name: sentence });
  expect(heading).toHaveAttribute("aria-label", sentence);
  for (const word of sentence.split(" ")) expect(isInaccessible(screen.getByText(word))).toBe(true);
});
