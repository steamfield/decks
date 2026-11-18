import { useTween } from "@react-decks/motion";
import { screen } from "@testing-library/react";
import { createElement } from "react";
import { expect, it } from "vitest";
import { DUR } from "../index";
import { setup, tick } from "../kit.test-support";
import { useTemplateMotion } from "./use-template-motion";

function Template({ at }: { at: number }) {
  const pose = useTween({ entered: 0, step: 0 });
  useTemplateMotion(
    at,
    (tl) => {
      tl.fromTo(pose, { entered: 0 }, { entered: 1, duration: DUR.draw, ease: "none" });
    },
    [
      (tl) => {
        tl.fromTo(pose, { step: 0 }, { step: 1, duration: DUR.draw, ease: "none" });
      },
    ],
  );
  return createElement("output", { "aria-label": "Pose" }, `${pose.entered}/${pose.step}`);
}

const pose = () => screen.getByLabelText("Pose");

it("plays the entrance on arrival when at is 0, then the step on click 1", async () => {
  const view = await setup(() => createElement(Template, { at: 0 }));
  expect(pose()).toHaveTextContent(/^0\/0$/);
  await tick(DUR.draw);
  expect(pose()).toHaveTextContent(/^1\/0$/);
  await view.next();
  await tick(DUR.draw);
  expect(pose()).toHaveTextContent(/^1\/1$/);
});

it("holds the hidden pose until click at, then plays the entrance and the step after it", async () => {
  const view = await setup(() => createElement(Template, { at: 2 }));
  await tick(DUR.draw);
  expect(pose()).toHaveTextContent(/^0\/0$/);
  await view.next();
  await tick(DUR.draw);
  expect(pose()).toHaveTextContent(/^0\/0$/);
  await view.next();
  await tick(DUR.draw);
  expect(pose()).toHaveTextContent(/^1\/0$/);
  await view.next();
  await tick(DUR.draw);
  expect(pose()).toHaveTextContent(/^1\/1$/);
});

it("shows the finished pose for the click with no animation outside the live slide", async () => {
  await setup(() => createElement(Template, { at: 0 }), { context: "overview", click: 0 });
  expect(pose()).toHaveTextContent(/^1\/0$/);
});

it("shows the click's pose at once when loaded at a later click", async () => {
  await setup(() => createElement(Template, { at: 2 }), { click: 3 });
  expect(pose()).toHaveTextContent(/^1\/1$/);
});
