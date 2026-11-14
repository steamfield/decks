import { act, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StoryCard, useScriptedDemo } from "./index";
import { setup, tick } from "./kit.test-support";

function Card() {
  const { clicks } = useScriptedDemo();
  return <StoryCard lead={clicks === 0 ? "First lead" : "New lead"} body={`Body ${clicks}`} />;
}

it("keeps outgoing copy during a swap and removes it after the incoming copy settles", async () => {
  const app = await setup(Card);
  await app.next();
  expect(screen.getByText("First lead")).toBeInTheDocument();
  expect(screen.getByText("New lead")).toBeInTheDocument();
  await tick(1);
  expect(screen.queryByText("First lead")).not.toBeInTheDocument();
  expect(screen.getByText("Body 1")).toBeVisible();
  await app.next();
  await app.previous();
  await tick(1);
  expect(screen.queryByText("Body 2")).not.toBeInTheDocument();
  expect(screen.getByText("Body 1")).toBeVisible();
});

it("swaps copy immediately with instant motion", async () => {
  const app = await setup(Card, { instant: true });
  await app.next();
  expect(screen.queryByText("First lead")).not.toBeInTheDocument();
  expect(screen.getByText("New lead")).toBeVisible();
});

it("restores fully opaque copy when leaving a swap and returning at the same last click", async () => {
  const app = await setup(Card, { click: 2 });
  await app.next();
  await tick(0.1);
  const opacity = () => {
    let value = 1;
    for (
      let element: Element | null = screen.getByText("Body 3");
      element;
      element = element.parentElement
    )
      value *= Number(getComputedStyle(element).opacity || 1);
    return value;
  };
  expect(opacity()).toBeLessThan(1);
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  await act(async () => app.store.dispatch({ type: "go", slide: 1, click: 3 }));
  await tick(0);
  expect(opacity()).toBe(1);
});
