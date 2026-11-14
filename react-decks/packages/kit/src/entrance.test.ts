import { useTween } from "@react-decks/motion";
import { createDeckStore, Deck, type DeckSource } from "@react-decks/runtime";
import { act, render, screen } from "@testing-library/react";
import { createElement, type Ref, StrictMode, useImperativeHandle, useRef } from "react";
import { expect, it, onTestFinished } from "vitest";
import { DUR, prefersReducedMotion, useStageEntrance } from "./index";
import { setup, tick } from "./kit.test-support";

function Stage() {
  const state = useTween({ opacity: 0, beat: 0 });
  useStageEntrance(
    (tl) => {
      tl.to(state, { opacity: 1, duration: DUR.draw, ease: "none" });
    },
    {
      beats: (tl, beat) => {
        beat(0);
        tl.to(state, { beat: 1, duration: DUR.draw });
        beat(1);
      },
    },
  );
  return createElement("output", { "aria-label": "Mark" }, `${state.opacity}/${state.beat}`);
}

it("reveals the first mark when advancing before the slide transition finishes without replaying on return to zero", async () => {
  document.documentElement.setAttribute("data-deck-transition", "");
  const view = await setup(Stage);
  expect(screen.getByLabelText("Mark")).toHaveTextContent("0/0");
  await view.next();
  expect(screen.getByLabelText("Mark")).toHaveTextContent(/^1\//);
  await act(async () => document.documentElement.removeAttribute("data-deck-transition"));
  await view.previous();
  await tick(0);
  expect(screen.getByLabelText("Mark")).toHaveTextContent("1/0");
  await tick(DUR.draw / 10);
  expect(screen.getByLabelText("Mark")).toHaveTextContent("1/0");
  await tick(DUR.draw);
  expect(screen.getByLabelText("Mark")).toHaveTextContent("1/0");
});

it("finishes an entrance already playing when the next beat starts", async () => {
  const view = await setup(Stage);
  await tick(DUR.draw / 10);
  expect(screen.getByLabelText("Mark")).toHaveTextContent("0.1/0");
  await view.next();
  expect(screen.getByLabelText("Mark")).toHaveTextContent(/^1\//);
});

it("cancels the old transition wait after leaving and re-entering", async () => {
  document.documentElement.setAttribute("data-deck-transition", "");
  const view = await setup(Stage);
  await act(async () => view.store.dispatch({ type: "go", slide: 2 }));
  await act(async () => document.documentElement.removeAttribute("data-deck-transition"));
  await tick(DUR.draw);
  expect(screen.getByLabelText("Mark")).toHaveTextContent(/^0\//);
  document.documentElement.setAttribute("data-deck-transition", "");
  await act(async () => view.store.dispatch({ type: "go", slide: 1 }));
  await tick(DUR.draw);
  expect(screen.getByLabelText("Mark")).toHaveTextContent("0/0");
  await act(async () => document.documentElement.removeAttribute("data-deck-transition"));
  await tick(DUR.draw);
  expect(screen.getByLabelText("Mark")).toHaveTextContent("1/0");
});

it.each(["overview", "presenter", "preview", "print"] as const)(
  "settles immediately in %s",
  async (context) => {
    await setup(Stage, { context });
    await tick(0);
    expect(screen.getByLabelText("Mark")).toHaveTextContent("1/0");
  },
);

it.each([{ instant: true }, { click: 2 }])(
  "settles on instant motion or entry at a later beat: %j",
  async (options) => {
    await setup(Stage, options);
    await tick(0);
    expect(screen.getByLabelText("Mark")).toHaveTextContent(options.click ? "1/1" : "1/0");
  },
);

it("settles the entrance when the system prefers reduced motion", async () => {
  const previous = Object.getOwnPropertyDescriptor(window, "matchMedia");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
  });
  onTestFinished(() => {
    if (previous) Object.defineProperty(window, "matchMedia", previous);
    else Reflect.deleteProperty(window, "matchMedia");
  });
  await setup(Stage);
  await tick(0);
  expect(prefersReducedMotion()).toBe(true);
  expect(screen.getByLabelText("Mark")).toHaveTextContent("1/0");
});

function Child({ ref }: { ref: Ref<{ target: number }> }) {
  useImperativeHandle(ref, () => ({ target: 1 }), []);
  return null;
}
function Parent() {
  const child = useRef<{ target: number }>(null);
  const state = useTween({ x: 0 });
  useStageEntrance((tl) => {
    if (!child.current) throw new Error("Missing child ref");
    tl.to(state, { x: child.current.target, duration: DUR.draw });
  });
  return createElement(
    "div",
    null,
    createElement(Child, { ref: child }),
    createElement("output", null, state.x),
  );
}

it("builds after child handles are attached and supports entrance without beats", async () => {
  await setup(Parent, { instant: true });
  await tick(0);
  expect(screen.getByRole("status")).toHaveTextContent("1");
});

it("plays a rebuilt entrance when React rechecks its layout effects", async () => {
  const source: DeckSource = {
    manifest: {
      name: "strict-entrance",
      title: "Strict entrance",
      canvas: { width: 1920, height: 1080 },
      slides: [{ no: 1, id: "s1", file: "1.mdx", title: "Stage", clicks: 1 }],
    },
    slides: { s1: async () => ({ default: Stage }) },
    frontmatter: {},
    components: {},
  };
  window.history.replaceState(null, "", "/#/1");
  const store = createDeckStore(source.manifest);
  const view = render(createElement(StrictMode, null, createElement(Deck, { source, store })));
  onTestFinished(() => {
    view.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
  });
  await screen.findByLabelText("Mark");
  await tick(DUR.draw);
  expect(screen.getByLabelText("Mark")).toHaveTextContent("1/0");
});
