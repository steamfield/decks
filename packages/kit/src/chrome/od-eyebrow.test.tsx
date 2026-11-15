import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { setup } from "../kit.test-support";
import { OdEyebrow } from "./od-eyebrow";

it("renders its label", async () => {
  await setup(() => <OdEyebrow>Case study</OdEyebrow>, { instant: true });
  expect(screen.getByText("Case study")).toBeVisible();
});
it("accepts nodes in its default slot", async () => {
  await setup(() => (
    <OdEyebrow>
      <strong>Thesis</strong>
    </OdEyebrow>
  ));
  expect(screen.getByText("Thesis")).toBeVisible();
});
