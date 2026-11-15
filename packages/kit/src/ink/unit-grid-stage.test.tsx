import { useTween } from "@react-decks/motion";
import { act, screen } from "@testing-library/react";
import { createRef, type Ref } from "react";
import { afterEach, expect, it } from "vitest";
import {
  DUR,
  ink,
  installTheme,
  resolveTheme,
  rippleProgress,
  STORY_STYLE,
  UnitGrid,
  type UnitGridHandle,
  unitCellCenter,
  useStage,
} from "../index";
import { setup, tick } from "../kit.test-support";
import { alpha, body, COUNT, fullyShown } from "./unit-grid.test-support";

installTheme(resolveTheme());
afterEach(() => {
  STORY_STYLE.ink = "clean";
});

function Waffle() {
  const state = useTween({ reveal: 0, ripple: 0 });
  useStage({
    copy: [{ lead: "Start" }, { lead: "Color" }],
    enter: (tl) => {
      tl.to(state, { reveal: 1, duration: DUR.bloom, ease: "none" });
    },
    beats: (tl, beat) => {
      beat(0);
      tl.to(state, { ripple: 1, duration: DUR.bloom, ease: "none" });
      beat(1);
    },
  });
  return (
    <svg role="img" aria-label="Units">
      <UnitGrid
        count={COUNT}
        reveal={state.reveal}
        recolor={1}
        colorBy={(_, i) =>
          `color-mix(in oklab, ${ink("rose", 2)} ${rippleProgress(state.ripple, unitCellCenter(i, {}), { x: 0, y: 0 }, 0.6, { reach: 1300, seed: "waffle", index: i }) * 100}%, ${ink("slate", 2)})`
        }
      />
    </svg>
  );
}
it.each([
  { context: "overview" as const, click: 1 },
  { instant: true, click: 1 },
])("settles the parent's ripple for %j", async (options) => {
  await setup(Waffle, options);
  await tick(0);
  expect(body(COUNT - 1).getAttribute("fill")).toContain(`${ink("rose", 2)} 100%`);
  expect(fullyShown()).toBe(true);
});
it("replays the external ripple forward after seeking back without partial cells", async () => {
  const app = await setup(Waffle);
  await tick(DUR.bloom);
  await app.next();
  await tick(DUR.bloom / 2);
  expect(body().getAttribute("fill")).not.toBe(body(COUNT - 1).getAttribute("fill"));
  await tick(DUR.bloom / 2);
  const end = body(COUNT - 1).getAttribute("fill");
  expect(end).toContain(`${ink("rose", 2)} 100%`);
  await app.previous();
  await tick(DUR.bloom);
  expect(body(COUNT - 1).getAttribute("fill")).toContain(`${ink("rose", 2)} 0%`);
  await app.next();
  await tick(DUR.bloom);
  expect(body(COUNT - 1)).toHaveAttribute("fill", end);
  expect(fullyShown()).toBe(true);
});
it("stops changing the grid while the slide is inactive", async () => {
  const app = await setup(Waffle);
  await app.next();
  await tick(DUR.bloom / 4);
  const drawn = body();
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  const end = drawn.getAttribute("fill");
  await tick(DUR.bloom);
  expect(drawn).toHaveAttribute("fill", end);
});

function Gather({ gridRef }: { gridRef: Ref<UnitGridHandle> }) {
  const state = useTween({ collapse: 0 });
  useStage({
    copy: [{ lead: "Start" }, { lead: "Gather" }],
    beats: (tl, beat) => {
      beat(0);
      tl.to(state, { collapse: 1, duration: DUR.gather, ease: "none" });
      beat(1);
    },
  });
  return (
    <svg role="img" aria-label="Units">
      <UnitGrid count={3} collapse={state.collapse} collapseStagger={0.5} ref={gridRef} />
    </svg>
  );
}
it("updates arrived while a parent timeline gathers the cells", async () => {
  const ref = createRef<UnitGridHandle>();
  const app = await setup(() => <Gather gridRef={ref} />);
  expect(ref.current?.arrived).toBe(0);
  await app.next();
  await tick(DUR.gather);
  expect(ref.current?.arrived).toBe(3);
  expect(alpha()).toBe(0);
});
