import { act, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { OdEyebrow } from "./od-eyebrow";

it.each([{ context: "overview" as const }, { instant: true }])(
  "renders its settled label: %j",
  async (options) => {
    await setup(() => <OdEyebrow>Case study</OdEyebrow>, options);
    expect(screen.getByText("Case study")).toBeVisible();
    await tick(1);
    expect(screen.getByText("Case study")).toBeVisible();
  },
);
it("accepts nodes in its default slot", async () => {
  await setup(() => (
    <OdEyebrow>
      <strong>Thesis</strong>
    </OdEyebrow>
  ));
  expect(screen.getByText("Thesis")).toBeVisible();
});
it("remains settled while inactive", async () => {
  const app = await setup(() => <OdEyebrow>Case study</OdEyebrow>);
  await act(async () => app.store.dispatch({ type: "go", slide: 2 }));
  await screen.findByRole("heading", { name: "Second slide" });
  await tick(1);
  expect(screen.getByText("Case study").textContent).toBe("Case study");
});
