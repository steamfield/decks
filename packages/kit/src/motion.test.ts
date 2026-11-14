import { gsap } from "@react-decks/motion";
import { expect, it, onTestFinished } from "vitest";
import { DUR, easeHeight, entrance, fadeIn, fadeOutInPlace, RISE, riseIn } from "./index";
import { tick } from "./kit.test-support";

function element(instant = false) {
  const previous = document.documentElement.getAttribute("data-deck-motion");
  document.documentElement.setAttribute("data-deck-motion", instant ? "instant" : "live");
  const el = document.createElement("div");
  document.body.append(el);
  onTestFinished(() => {
    gsap.killTweensOf(el);
    el.remove();
    if (previous === null) document.documentElement.removeAttribute("data-deck-motion");
    else document.documentElement.setAttribute("data-deck-motion", previous);
  });
  return el;
}

it.each([fadeIn, riseIn])("fades incoming chrome and completes once: %s", async (show) => {
  const el = element();
  const completions: string[] = [];
  show(el, () => completions.push("done"));
  await tick(0);
  expect(el).toHaveStyle({ opacity: "0" });
  if (show === riseIn) expect(gsap.getProperty(el, "y")).toBe(RISE.card);
  await tick(DUR.card);
  expect(el).toHaveStyle({ opacity: "1" });
  expect(completions).toEqual(["done"]);
  if (show === riseIn) expect(gsap.getProperty(el, "y")).toBe(0);
});

it("takes outgoing copy out of flow and fades it in place", async () => {
  const el = element();
  gsap.set(el, { y: RISE.card });
  const completions: string[] = [];
  fadeOutInPlace(el, () => completions.push("done"));
  expect(el).toHaveStyle({ position: "absolute", top: "0px", left: "0px", right: "0px" });
  await tick(DUR.opacity);
  expect(el).toHaveStyle({ opacity: "0" });
  expect(gsap.getProperty(el, "y")).toBe(RISE.card);
  expect(completions).toEqual(["done"]);
});

it.each([fadeIn, riseIn, fadeOutInPlace])(
  "settles the callback immediately in instant mode: %s",
  (show) => {
    const el = element(true);
    const completions: string[] = [];
    show(el, () => completions.push("done"));
    expect(el).toHaveStyle({ opacity: show === fadeOutInPlace ? "0" : "1" });
    expect(completions).toEqual(["done"]);
  },
);

it("staggers nonempty entrance groups and leaves them settled", () => {
  const a = element();
  const b = element();
  const tl = entrance({ groups: [[a], [], [b]] }).pause();
  onTestFinished(() => {
    tl.kill();
  });
  expect(tl.duration()).toBe(DUR.morph + DUR.opacity);
  tl.seek(DUR.opacity / 2);
  expect(Number(gsap.getProperty(a, "opacity"))).toBeGreaterThan(0);
  expect(Number(gsap.getProperty(b, "opacity"))).toBe(0);
  tl.progress(1);
  expect(a).toHaveStyle({ opacity: "1", transform: "none" });
  expect(b).toHaveStyle({ opacity: "1", transform: "none" });
});

it("settles every entrance group immediately in instant mode", () => {
  const el = element(true);
  const tl = entrance({ groups: [[el]] });
  onTestFinished(() => {
    tl.kill();
  });
  expect(el).toHaveStyle({ opacity: "1", transform: "none" });
  expect(tl.paused()).toBe(true);
});

it("releases an old height and overflow in instant mode", () => {
  const el = element(true);
  el.style.height = "120px";
  el.style.overflow = "hidden";
  easeHeight(el, 120);
  expect(el.style.height).toBe("");
  expect(el.style.overflow).toBe("");
});
