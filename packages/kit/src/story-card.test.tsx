import { act, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { StoryCard, Underline, useScriptedDemo } from "./index";
import { setup, tick } from "./kit.test-support";

function Card() {
  const { clicks } = useScriptedDemo();
  return <StoryCard lead={clicks === 0 ? "First lead" : "New lead"} body={`Body ${clicks}`} />;
}

function HiddenCard() {
  return (
    <StoryCard
      className="is-filled"
      style={{ visibility: "hidden" }}
      lead="Hidden lead"
      body="Hidden body"
    />
  );
}

it("lets a deck hide the entire card with its root style", async () => {
  await setup(HiddenCard, { instant: true });
  expect(screen.getByText("Hidden lead")).not.toBeVisible();
  expect(screen.getByText("Hidden body")).not.toBeVisible();
});

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

function MarkedCard() {
  const { clicks } = useScriptedDemo();
  return (
    <StoryCard
      lead={clicks === 1 ? "Austin is last." : "Other lead."}
      leadContent={
        clicks === 1 ? (
          <>
            Austin is <Underline>last</Underline>.
          </>
        ) : undefined
      }
      body={`Body ${clicks}`}
    />
  );
}

it("keeps the marked outgoing lead until the new copy settles, including after a reverse", async () => {
  const app = await setup(MarkedCard, { click: 1 });
  expect(screen.getByText("last")).toBeVisible();
  await app.next();
  expect(screen.getByText("last")).toBeVisible();
  await tick(1);
  expect(screen.queryByText("last")).not.toBeInTheDocument();
  await app.previous();
  await tick(1);
  expect(screen.getByText("last")).toBeVisible();
  await app.next();
  expect(screen.getByText("last")).toBeVisible();
  await tick(1);
  expect(screen.queryByText("last")).not.toBeInTheDocument();
});

it.each([{ instant: true }, { context: "presenter" as const }])(
  "renders the marked lead immediately at a direct click: %j",
  async (options) => {
    await setup(MarkedCard, { ...options, click: 1 });
    expect(screen.getByText("last")).toBeVisible();
    expect(screen.getByText("Body 1")).toBeVisible();
    expect(screen.queryByText("Other lead.")).not.toBeInTheDocument();
  },
);

function ChangingMarkupCard() {
  const { clicks } = useScriptedDemo();
  return (
    <StoryCard
      lead={clicks < 2 ? "Austin is last." : "Other lead."}
      leadContent={
        clicks === 1 ? (
          <>
            Austin is <Underline>last</Underline>.
          </>
        ) : undefined
      }
    />
  );
}

it("keeps the latest lead markup in a later swap when only the markup changed first", async () => {
  const app = await setup(ChangingMarkupCard);
  await app.next();
  await tick(1);
  expect(screen.getByText("last")).toBeVisible();
  await app.next();
  expect(screen.getByText("last")).toBeVisible();
  await tick(1);
  expect(screen.queryByText("last")).not.toBeInTheDocument();
});
