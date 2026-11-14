import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { setup, tick } from "./kit.test-support";
import { useScriptedDemo } from "./scripted-demo";
import { Underline } from "./underline";

it.each([
  {},
  { instant: true },
  { context: "overview" as const },
  { context: "presenter" as const },
  { context: "preview" as const },
])("preserves inline content without waiting for motion: %j", async (options) => {
  await setup(
    () => (
      <p>
        Austin is <Underline>last</Underline>.
      </p>
    ),
    options,
  );
  expect(screen.getByText("last")).toBeVisible();
  await tick(1);
  expect(screen.getByText("last")).toBeVisible();
});

function Word() {
  const { clicks } = useScriptedDemo();
  return <Underline>{clicks === 0 ? "first" : "last"}</Underline>;
}

it("updates the word when the slide moves forward and backward", async () => {
  const app = await setup(Word);
  expect(screen.getByText("first")).toBeVisible();
  await app.next();
  expect(screen.getByText("last")).toBeVisible();
  expect(screen.queryByText("first")).not.toBeInTheDocument();
  await app.previous();
  expect(screen.getByText("first")).toBeVisible();
  expect(screen.queryByText("last")).not.toBeInTheDocument();
});
