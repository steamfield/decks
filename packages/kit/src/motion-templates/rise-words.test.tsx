import { CustomEase, duration, ease, gsap, rise, SplitText, stagger } from "@react-decks/motion";
import { createDeckStore, Deck, type DeckSource } from "@react-decks/runtime";
import { render, screen } from "@testing-library/react";
import { StrictMode, useLayoutEffect, useRef } from "react";
import { expect, it, onTestFinished } from "vitest";
import { setup, tick } from "../kit.test-support";
import { riseWords } from "./rise-words";
import { useTemplateMotion } from "./use-template-motion";

// jsdom reads computed letter-spacing and white-space from a stylesheet, but does no layout, and
// it serializes letter-spacing in whole pixels, so the font size makes the open value whole.
const sheet = `
  h2 { font-size: 200px; letter-spacing: -2px; }
  h2.nowrap { white-space: nowrap; }
`;

function Heading({
  text,
  at = 0,
  nowrap = false,
  starts = [],
}: {
  text: string;
  at?: number;
  nowrap?: boolean;
  starts?: number[];
}) {
  const element = useRef<HTMLHeadingElement>(null);
  const split = useRef<SplitText | null>(null);
  useLayoutEffect(() => {
    if (!element.current) return;
    const words = SplitText.create(element.current, { type: "words", mask: "words" });
    split.current = words;
    return () => {
      words.revert();
      split.current = null;
    };
  }, []);
  useTemplateMotion(at, (tl) => {
    starts.push(riseWords(tl, element.current, split.current?.words ?? [], 0));
  });
  return (
    <>
      <style>{sheet}</style>
      <h2 ref={element} className={nowrap ? "nowrap" : undefined}>
        {text}
      </h2>
    </>
  );
}

const pose = (word: string) => {
  const element = screen.getByText(word);
  return [gsap.getProperty(element, "yPercent"), gsap.getProperty(element, "skewY")];
};
const tracking = () => screen.getByRole("heading").style.letterSpacing;

it("each word starts below its mask, leaning, and settles upright on the snap curve", async () => {
  const view = await setup(() => <Heading text="The river changed course." at={1} />);
  expect(pose("The")).toEqual([rise.clear, rise.lean]);
  await view.next();
  await tick(duration.slow / 2);
  const [y, skew] = pose("The");
  const progress = CustomEase.get(ease.snap)(0.5);
  expect(y).toBeCloseTo(rise.clear * (1 - progress), 3);
  expect(skew).toBeCloseTo(rise.lean * (1 - progress), 3);
  await tick(duration.slow);
  for (const word of ["The", "river", "changed", "course."]) expect(pose(word)).toEqual([0, 0]);
});

it("a long headline starts its last word no later than a short one would, so both land together", async () => {
  const starts: number[] = [];
  const long = "One two three four five six seven eight nine ten eleven twelve";
  const view = await setup(() => <Heading text={long} at={1} starts={starts} />);
  await view.next();
  await tick(duration.base);
  expect(pose("twelve")[0]).toBe(rise.clear);
  await tick(duration.slow);
  expect(pose("twelve")).toEqual([0, 0]);
  view.unmount();
  await setup(() => <Heading text="Two words" at={1} starts={starts} />);
  expect(starts).toEqual([duration.base, stagger]);
});

it("a heading that cannot wrap closes its tracking from slightly open to its resting value", async () => {
  const view = await setup(() => <Heading text="Ship daily" at={1} nowrap />);
  // 0.035em looser than the resting -2px at 200px.
  expect(tracking()).toBe("5px");
  await view.next();
  await tick(duration.slow);
  expect(tracking()).toBe("-2px");
});

it("a heading that cannot wrap still settles on its resting tracking when its timeline is rebuilt", async () => {
  // StrictMode runs every layout effect twice, so the second build finds what the first left
  // inline on the same heading.
  const source: DeckSource = {
    manifest: {
      name: "strict-rise",
      title: "Strict rise",
      canvas: { width: 1920, height: 1080 },
      slides: [{ no: 1, id: "s1", file: "1.mdx", title: "Rise", clicks: 0 }],
    },
    slides: { s1: async () => ({ default: () => <Heading text="Ship daily" nowrap /> }) },
    frontmatter: {},
    components: {},
  };
  window.history.replaceState(null, "", "/#/1");
  const store = createDeckStore(source.manifest);
  const view = render(
    <StrictMode>
      <Deck source={source} store={store} />
    </StrictMode>,
  );
  onTestFinished(() => {
    view.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  await screen.findByRole("heading");
  await tick(duration.slow);
  expect(tracking()).toBe("-2px");
});

it("a heading that can wrap rises without touching its tracking", async () => {
  const view = await setup(() => <Heading text="The river changed course." at={1} />);
  await view.next();
  await tick(duration.quick);
  expect(tracking()).toBe("");
  await tick(duration.slow);
  expect(tracking()).toBe("");
});
